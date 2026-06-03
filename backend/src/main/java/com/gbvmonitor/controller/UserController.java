package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.UserRequest;
import com.gbvmonitor.dto.UserResponse;
import com.gbvmonitor.entity.Role;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.AuditLogRepository;
import com.gbvmonitor.repository.CaseRepository;
import com.gbvmonitor.repository.NotificationRepository;
import com.gbvmonitor.repository.RoleRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.repository.VictimRepository;
import com.gbvmonitor.service.AccessControlService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CaseRepository caseRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final VictimRepository victimRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessControlService accessControlService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean enabled,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        List<UserResponse> users = userRepository.findAll().stream()
                .filter(user -> !accessControlService.isDistrictAdmin(actor) || accessControlService.canSeeUser(actor, user))
                .filter(user -> role == null || role.isBlank() || user.getRoles().stream()
                        .map(Role::getName)
                        .anyMatch(userRole -> userRole.equalsIgnoreCase(normalizeRole(role))))
                .filter(user -> enabled == null || user.isEnabled() == enabled)
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "Users fetched", users));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @RequestBody UserRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        accessControlService.requireAdminOrDistrictAdmin(actor);
        if (!StringUtils.hasText(request.getUsername()) || !StringUtils.hasText(request.getEmail()) || !StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Username, email, and password are required");
        }

        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        String normalizedRole = normalizeRole(request.getRole());
        Role role = roleRepository.findByName(normalizedRole)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + normalizedRole));

        String district = request.getDistrict();
        String institution = request.getInstitution();
        if (accessControlService.isDistrictAdmin(actor)) {
            if ("ADMIN".equals(normalizedRole) || "DISTRICT_ADMIN".equals(normalizedRole)) {
                throw new AccessDeniedException("District administrator cannot create administrator accounts");
            }
            district = actor.getDistrict();
            if (!StringUtils.hasText(district)) {
                throw new AccessDeniedException("District administrator has no district assigned");
            }
            if ("PARTNER".equals(normalizedRole)) {
                throw new AccessDeniedException("District administrator cannot create partner institutions");
            }
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .displayName(StringUtils.hasText(request.getDisplayName()) ? request.getDisplayName().trim() : request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .password(passwordEncoder.encode(request.getPassword()))
                .district(district)
                .institution(institution)
                .enabled(true)
                .roles(new HashSet<>(Set.of(role)))
                .createdAt(new Date())
                .build();

        return ResponseEntity.ok(new ApiResponse<>(true, "User created", toResponse(userRepository.save(user))));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile fetched", toResponse(actor)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentProfile(
            @RequestBody UserRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        if (!StringUtils.hasText(request.getDisplayName())) {
            throw new IllegalArgumentException("Display name is required");
        }
        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(email, email)
                .filter(existing -> !existing.getId().equals(actor.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Email already exists");
                });

        actor.setDisplayName(request.getDisplayName().trim());
        actor.setEmail(email);
        actor.setDistrict(StringUtils.hasText(request.getDistrict()) ? request.getDistrict().trim() : null);
        actor.setInstitution(StringUtils.hasText(request.getInstitution()) ? request.getInstitution().trim() : null);

        if (accessControlService.hasRole(actor, "VICTIM")) {
            var victim = victimRepository.findByAccountId(actor.getId())
                    .orElseGet(() -> com.gbvmonitor.entity.Victim.builder().account(actor).build());
            victim.setName(actor.getDisplayName());
            victim.setAddress(actor.getDistrict());
            victimRepository.save(victim);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated", toResponse(userRepository.save(actor))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @RequestBody UserRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        accessControlService.requireUserAccess(actor, user);

        if (!StringUtils.hasText(request.getUsername()) || !StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Username and email are required");
        }

        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(username, username)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Username already exists");
                });
        userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(email, email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Email already exists");
                });

        String normalizedRole = normalizeRole(request.getRole());
        Role role = roleRepository.findByName(normalizedRole)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + normalizedRole));

        String district = request.getDistrict();
        String institution = request.getInstitution();
        if (accessControlService.isDistrictAdmin(actor)) {
            if ("ADMIN".equals(normalizedRole) || "DISTRICT_ADMIN".equals(normalizedRole) || "PARTNER".equals(normalizedRole)) {
                throw new AccessDeniedException("District administrator cannot assign this role");
            }
            district = actor.getDistrict();
            institution = null;
        }

        user.setUsername(username);
        user.setDisplayName(StringUtils.hasText(request.getDisplayName()) ? request.getDisplayName().trim() : username);
        user.setEmail(email);
        user.setDistrict("PARTNER".equals(normalizedRole) ? null : district);
        user.setInstitution("PARTNER".equals(normalizedRole) ? institution : null);
        user.setRoles(new HashSet<>(Set.of(role)));
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if ("VICTIM".equals(normalizedRole)) {
            var victim = victimRepository.findByAccountId(user.getId())
                    .orElseGet(() -> com.gbvmonitor.entity.Victim.builder().account(user).build());
            victim.setName(user.getDisplayName());
            victim.setAddress(user.getDistrict());
            victimRepository.save(victim);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "User updated", toResponse(userRepository.save(user))));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        accessControlService.requireUserAccess(actor, user);
        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            throw new IllegalArgumentException("enabled is required");
        }
        user.setEnabled(enabled);
        return ResponseEntity.ok(new ApiResponse<>(true, "User status updated", toResponse(userRepository.save(user))));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User actor = accessControlService.currentUser(userDetails);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        accessControlService.requireUserAccess(actor, user);
        if (actor.getId().equals(user.getId())) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }

        caseRepository.findByAssignedOfficer_Id(id).forEach(aCase -> {
            aCase.setAssignedOfficer(null);
            caseRepository.save(aCase);
        });
        notificationRepository.findByUser_Id(id).forEach(notification -> {
            notification.setUser(null);
            notificationRepository.save(notification);
        });
        auditLogRepository.findByUser_Id(id).forEach(log -> {
            log.setUser(null);
            auditLogRepository.save(log);
        });
        victimRepository.findByAccountId(id).ifPresent(victim -> {
            victim.setAccount(null);
            victimRepository.save(victim);
        });

        userRepository.delete(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "User deleted", null));
    }

    private String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "PUBLIC";
        }
        return role.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }

    private UserResponse toResponse(User user) {
        String primaryRole = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("PUBLIC");

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                primaryRole,
                user.isEnabled(),
                user.getDistrict(),
                user.getInstitution(),
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }
}
