package com.gbvmonitor.controller;

import com.gbvmonitor.dto.LoginRequest;
import com.gbvmonitor.dto.LoginResponse;
import com.gbvmonitor.dto.RegisterRequest;
import com.gbvmonitor.dto.VerificationPinRequest;
import com.gbvmonitor.entity.Role;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.entity.Victim;
import com.gbvmonitor.repository.RoleRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.repository.VictimRepository;
import com.gbvmonitor.security.JwtTokenProvider;
import com.gbvmonitor.security.UserPrincipal;
import com.gbvmonitor.service.VictimEmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;

import java.util.Date;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VictimRepository victimRepository;
    private final PasswordEncoder passwordEncoder;
    private final VictimEmailVerificationService victimEmailVerificationService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userPrincipal.getUsername(), userPrincipal.getId());
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(userPrincipal.getUsername(), userPrincipal.getUsername())
                .orElseThrow();
        user.setLastLoginAt(new Date());
        userRepository.save(user);
        String primaryRole = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("PUBLIC");
        return ResponseEntity.ok(new LoginResponse(
                true,
                "Login successful",
                token,
                user.getId().toString(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                primaryRole,
                user.getDistrict(),
                user.getInstitution(),
                null
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(createUser(request, "User registered"));
    }

    @PostMapping("/register/request-pin")
    public ResponseEntity<LoginResponse> requestVictimRegistrationPin(@RequestBody RegisterRequest request) {
        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email address is required for email verification.");
        }

        RegisterRequest normalizedRequest = copyWithNormalizedIdentity(request);
        validateUniqueIdentity(normalizedRequest.getUsername(), normalizedRequest.getEmail());
        String verificationPin = victimEmailVerificationService.requestVerificationPin(normalizedRequest);

        return ResponseEntity.ok(new LoginResponse(
                true,
                verificationPin == null
                        ? "Verification PIN sent to your email address."
                        : "Email delivery is not configured. Use the demo PIN shown in the app.",
                null,
                null,
                normalizedRequest.getUsername(),
                normalizedRequest.getDisplayName(),
                normalizedRequest.getEmail(),
                normalizeRole(normalizedRequest.getRole()),
                normalizedRequest.getDistrict(),
                normalizedRequest.getInstitution(),
                verificationPin
        ));
    }

    @PostMapping("/register/verify-pin")
    public ResponseEntity<LoginResponse> verifyVictimRegistrationPin(@RequestBody VerificationPinRequest request) {
        RegisterRequest verifiedRequest = victimEmailVerificationService.verifyPin(request);
        return ResponseEntity.ok(createUser(verifiedRequest, "Email verified. User registered successfully."));
    }

    private String normalizeRequired(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Username is required");
        }
        return value.trim();
    }

    private String resolveEmail(RegisterRequest request) {
        if (StringUtils.hasText(request.getEmail())) {
            return request.getEmail().trim().toLowerCase(Locale.ROOT);
        }

        String username = normalizeRequired(request.getUsername());
        if (username.contains("@")) {
            return username.toLowerCase(Locale.ROOT);
        }

        String normalized = username.replaceAll("[^A-Za-z0-9]", "");
        if (!StringUtils.hasText(normalized)) {
            normalized = "victim" + UUID.randomUUID().toString().replace("-", "");
        }
        return normalized.toLowerCase(Locale.ROOT) + "@phone.gbvmonitor.local";
    }

    private String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "VICTIM";
        }
        return role.trim()
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
    }

    private RegisterRequest copyWithNormalizedIdentity(RegisterRequest request) {
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Password is required");
        }

        RegisterRequest normalizedRequest = new RegisterRequest();
        normalizedRequest.setUsername(normalizeRequired(request.getUsername()));
        normalizedRequest.setPassword(request.getPassword());
        normalizedRequest.setEmail(resolveEmail(request));
        normalizedRequest.setRole(normalizeRole(request.getRole()));
        normalizedRequest.setDisplayName(StringUtils.hasText(request.getDisplayName()) ? request.getDisplayName().trim() : normalizedRequest.getUsername());
        normalizedRequest.setDistrict(StringUtils.hasText(request.getDistrict()) ? request.getDistrict().trim() : null);
        normalizedRequest.setInstitution(StringUtils.hasText(request.getInstitution()) ? request.getInstitution().trim() : null);
        normalizedRequest.setAgeGroup(StringUtils.hasText(request.getAgeGroup()) ? request.getAgeGroup().trim() : null);
        return normalizedRequest;
    }

    private void validateUniqueIdentity(String username, String email) {
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
    }

    private LoginResponse createUser(RegisterRequest request, String successMessage) {
        RegisterRequest normalizedRequest = copyWithNormalizedIdentity(request);
        validateUniqueIdentity(normalizedRequest.getUsername(), normalizedRequest.getEmail());

        Role role = roleRepository.findByName(normalizedRequest.getRole())
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + normalizedRequest.getRole()));

        User user = User.builder()
                .username(normalizedRequest.getUsername())
                .displayName(normalizedRequest.getDisplayName())
                .password(passwordEncoder.encode(normalizedRequest.getPassword()))
                .email(normalizedRequest.getEmail())
                .district(normalizedRequest.getDistrict())
                .institution("PARTNER".equals(role.getName()) ? normalizedRequest.getInstitution() : null)
                .enabled(true)
                .roles(Set.of(role))
                .createdAt(new Date())
                .build();
        userRepository.save(user);

        if ("VICTIM".equals(role.getName())) {
            victimRepository.save(Victim.builder()
                    .name(normalizedRequest.getDisplayName())
                    .age("child".equalsIgnoreCase(normalizedRequest.getAgeGroup()) ? 17 : null)
                    .address(normalizedRequest.getDistrict())
                    .account(user)
                    .build());
        }

        return new LoginResponse(
                true,
                successMessage,
                null,
                user.getId().toString(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                role.getName(),
                user.getDistrict(),
                user.getInstitution(),
                null
        );
    }
}
