package com.gbvmonitor.service;

import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.Role;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.repository.VictimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AccessControlService {
    private final UserRepository userRepository;
    private final VictimRepository victimRepository;

    public User currentUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication is required");
        }
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(userDetails.getUsername(), userDetails.getUsername())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user was not found"));
    }

    public boolean hasRole(User user, String roleName) {
        String normalized = normalizeRole(roleName);
        return user.getRoles().stream()
                .map(Role::getName)
                .anyMatch(role -> normalizeRole(role).equals(normalized));
    }

    public boolean isAdmin(User user) {
        return hasRole(user, "ADMIN");
    }

    public boolean isDistrictAdmin(User user) {
        return hasRole(user, "DISTRICT_ADMIN");
    }

    public void requireAdminOrDistrictAdmin(User user) {
        if (!isAdmin(user) && !isDistrictAdmin(user)) {
            throw new AccessDeniedException("Administrator access is required");
        }
    }

    public void requireCaseAccess(User user, Case aCase) {
        requireAdminOrDistrictAdmin(user);
        if (isAdmin(user)) {
            return;
        }
        if (!StringUtils.hasText(user.getDistrict())) {
            throw new AccessDeniedException("District administrator has no district assigned");
        }
        if (!caseMatchesDistrict(aCase, user.getDistrict())) {
            throw new AccessDeniedException("District administrator can only manage cases in their district");
        }
    }

    public void requireAssignableOfficer(User actor, User officer) {
        requireAdminOrDistrictAdmin(actor);
        if (!hasRole(officer, "POLICE")) {
            throw new AccessDeniedException("Cases can only be assigned to police officers");
        }
        if (!officer.isEnabled()) {
            throw new AccessDeniedException("Cases can only be assigned to active police officers");
        }
        if (isDistrictAdmin(actor) && !districtMatches(actor.getDistrict(), officer.getDistrict())) {
            throw new AccessDeniedException("District administrator can only assign officers in their district");
        }
    }

    public void requireOfficerMatchesCase(User officer, Case aCase) {
        if (!hasRole(officer, "POLICE")) {
            throw new AccessDeniedException("Cases can only be assigned to police officers");
        }
        if (!officer.isEnabled()) {
            throw new AccessDeniedException("Cases can only be assigned to active police officers");
        }
        if (!caseMatchesDistrict(aCase, officer.getDistrict())) {
            throw new AccessDeniedException("Case can only be assigned to an officer in the same district");
        }
    }

    public void requireUserAccess(User actor, User target) {
        requireAdminOrDistrictAdmin(actor);
        if (isAdmin(actor)) {
            return;
        }
        if (!districtMatches(actor.getDistrict(), target.getDistrict())) {
            throw new AccessDeniedException("District administrator can only manage users in their district");
        }
        if (hasRole(target, "ADMIN") || hasRole(target, "DISTRICT_ADMIN")) {
            throw new AccessDeniedException("District administrator cannot manage administrator accounts");
        }
    }

    public boolean canSeeUser(User actor, User target) {
        if (isAdmin(actor)) {
            return true;
        }
        if (!isDistrictAdmin(actor)) {
            return false;
        }
        if (hasRole(target, "ADMIN") || hasRole(target, "DISTRICT_ADMIN")) {
            return false;
        }
        if (districtMatches(actor.getDistrict(), target.getDistrict())) {
            return true;
        }
        if (!hasRole(target, "VICTIM")) {
            return false;
        }
        return victimRepository.findByAccountId(target.getId())
                .map(victim -> districtMatches(actor.getDistrict(), victim.getAddress()))
                .orElse(false);
    }

    public boolean canSeeCase(User actor, Case aCase) {
        if (isAdmin(actor)) {
            return true;
        }
        if (isDistrictAdmin(actor)) {
            return caseMatchesDistrict(aCase, actor.getDistrict());
        }
        if (hasRole(actor, "VICTIM")) {
            return aCase.getVictim() != null
                    && aCase.getVictim().getAccount() != null
                    && aCase.getVictim().getAccount().getId().equals(actor.getId());
        }
        if (hasRole(actor, "POLICE")) {
            return aCase.getAssignedOfficer() != null
                    && aCase.getAssignedOfficer().getId().equals(actor.getId());
        }
        if (hasRole(actor, "SOCIAL_WORKER")) {
            return caseMatchesDistrict(aCase, actor.getDistrict());
        }
        return false;
    }

    public void requireCaseViewAccess(User actor, Case aCase) {
        if (!canSeeCase(actor, aCase)) {
            throw new AccessDeniedException("You can only view recovery data for permitted cases");
        }
    }

    public void requireRecoveryManageAccess(User actor, Case aCase) {
        if (isAdmin(actor)) {
            return;
        }
        if (isDistrictAdmin(actor) && caseMatchesDistrict(aCase, actor.getDistrict())) {
            return;
        }
        if (hasRole(actor, "SOCIAL_WORKER") && caseMatchesDistrict(aCase, actor.getDistrict())) {
            return;
        }
        if (hasRole(actor, "POLICE")
                && aCase.getAssignedOfficer() != null
                && aCase.getAssignedOfficer().getId().equals(actor.getId())) {
            return;
        }
        throw new AccessDeniedException("You can only manage recovery milestones for permitted cases");
    }

    public String caseDistrict(Case aCase) {
        if (aCase.getVictim() == null) {
            return null;
        }
        if (StringUtils.hasText(aCase.getVictim().getAddress())) {
            return aCase.getVictim().getAddress();
        }
        return aCase.getVictim().getAccount() != null ? aCase.getVictim().getAccount().getDistrict() : null;
    }

    public boolean caseMatchesDistrict(Case aCase, String district) {
        if (aCase.getVictim() == null) {
            return false;
        }
        String incidentDistrict = aCase.getVictim().getAddress();
        String victimAccountDistrict = aCase.getVictim().getAccount() != null
                ? aCase.getVictim().getAccount().getDistrict()
                : null;
        return Stream.of(incidentDistrict, victimAccountDistrict)
                .anyMatch(candidate -> districtMatches(candidate, district));
    }

    public boolean districtMatches(String left, String right) {
        return StringUtils.hasText(left)
                && StringUtils.hasText(right)
                && left.trim().equalsIgnoreCase(right.trim());
    }

    public String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "PUBLIC";
        }
        return role.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }
}
