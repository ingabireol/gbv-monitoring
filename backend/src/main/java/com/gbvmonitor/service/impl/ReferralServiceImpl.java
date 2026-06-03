package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.ReferralRequest;
import com.gbvmonitor.dto.ReferralResponse;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.Referral;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.CaseRepository;
import com.gbvmonitor.repository.MilestoneRepository;
import com.gbvmonitor.repository.NotificationRepository;
import com.gbvmonitor.repository.ReferralRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.service.AccessControlService;
import com.gbvmonitor.service.ReferralService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Date;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.util.Comparator;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReferralServiceImpl implements ReferralService {
    private final ReferralRepository referralRepository;
    private final CaseRepository caseRepository;
    private final MilestoneRepository milestoneRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    @Override
    @Transactional
    public ReferralResponse createReferral(ReferralRequest request, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(request.getCaseId()).orElseThrow();
        requireReferralCaseAccess(actor, aCase);
        Referral referral = Referral.builder()
                .aCase(aCase)
                .referredTo(request.getReferredTo())
                .referredBy(request.getReferredBy())
                .referredByRole(request.getReferredByRole())
                .institutionType(request.getInstitutionType())
                .reason(request.getReason())
                .urgency(request.getUrgency())
                .status("PENDING")
                .createdAt(new Date())
                .build();
        referralRepository.save(referral);
        completeMilestone(aCase, "Support");
        notifyPartnerReferral(referral);
        return toResponse(referral);
    }

    @Override
    @Transactional
    public ReferralResponse updateReferral(UUID referralId, ReferralRequest request, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Referral referral = referralRepository.findById(referralId).orElseThrow();
        requireReferralEditAccess(actor, referral);

        if (request.getCaseId() != null && !request.getCaseId().equals(referral.getACase().getId())) {
            Case aCase = caseRepository.findById(request.getCaseId()).orElseThrow();
            requireReferralCaseAccess(actor, aCase);
            referral.setACase(aCase);
        }
        if (StringUtils.hasText(request.getReferredTo())) {
            referral.setReferredTo(request.getReferredTo().trim());
        }
        if (StringUtils.hasText(request.getInstitutionType())) {
            referral.setInstitutionType(request.getInstitutionType().trim());
        }
        if (request.getReason() != null) {
            referral.setReason(request.getReason().trim());
        }
        if (StringUtils.hasText(request.getUrgency())) {
            referral.setUrgency(request.getUrgency().trim().toUpperCase());
        }
        referral.setUpdatedAt(new Date());
        referralRepository.save(referral);
        completeMilestone(referral.getACase(), "Support");
        return toResponse(referral);
    }

    @Override
    @Transactional
    public ReferralResponse updateReferralStatus(UUID referralId, String status, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Referral referral = referralRepository.findById(referralId).orElseThrow();
        requireReferralStatusAccess(actor, referral);
        referral.setStatus(status);
        if (status != null && !status.equalsIgnoreCase("PENDING") && referral.getDateAcknowledged() == null) {
            referral.setDateAcknowledged(new Date());
        }
        referral.setUpdatedAt(new Date());
        referralRepository.save(referral);
        if (status != null && !status.equalsIgnoreCase("PENDING")) {
            completeMilestone(referral.getACase(), "Support");
        }
        notifyReferralCreator(referral, actor, status);
        return toResponse(referral);
    }

    private void notifyPartnerReferral(Referral referral) {
        userRepository.findAll().stream()
                .filter(user -> accessControlService.hasRole(user, "PARTNER"))
                .filter(user -> StringUtils.hasText(referral.getReferredTo())
                        && (referral.getReferredTo().equalsIgnoreCase(user.getInstitution())
                        || referral.getReferredTo().equalsIgnoreCase(user.getDisplayName())
                        || referral.getReferredTo().equalsIgnoreCase(user.getUsername())))
                .forEach(user -> notificationRepository.save(com.gbvmonitor.entity.Notification.builder()
                        .user(user)
                        .type("REFERRAL_RECEIVED")
                        .message(String.format("Referral for case %s was sent to your institution. Please acknowledge or reject it.", referral.getACase().getCaseId()))
                        .read(false)
                        .createdAt(new Date())
                        .build()));
    }

    private void notifyReferralCreator(Referral referral, User actor, String status) {
        if (!StringUtils.hasText(referral.getReferredBy())) {
            return;
        }

        userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(referral.getReferredBy(), referral.getReferredBy())
                .or(() -> userRepository.findAll().stream()
                        .filter(user -> referral.getReferredBy().equalsIgnoreCase(user.getDisplayName()))
                        .findFirst())
                .filter(user -> !user.getId().equals(actor.getId()))
                .ifPresent(user -> notificationRepository.save(com.gbvmonitor.entity.Notification.builder()
                        .user(user)
                        .type("REFERRAL_RESPONSE")
                        .message(String.format("%s responded to referral for case %s: %s.",
                                referral.getReferredTo(),
                                referral.getACase().getCaseId(),
                                formatReferralStatus(status)))
                        .read(false)
                        .createdAt(new Date())
                        .build()));
    }

    private String formatReferralStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return "Updated";
        }
        return status.trim().replace('_', ' ').toLowerCase();
    }

    @Override
    public Page<ReferralResponse> getReferralsByCase(UUID caseId, Pageable pageable, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        requireReferralCaseAccess(actor, aCase);
        var filtered = referralRepository.findAll().stream()
                .filter(r -> r.getACase().getId().equals(caseId))
                .sorted(Comparator.comparing(Referral::getCreatedAt).reversed())
                .map(this::toResponse)
                .collect(Collectors.toList());
        int start = Math.min((int) pageable.getOffset(), filtered.size());
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public Page<ReferralResponse> getReferrals(String referredTo, String status, Pageable pageable, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        var filtered = referralRepository.findAll().stream()
                .filter(r -> !(accessControlService.isAdmin(actor) || accessControlService.isDistrictAdmin(actor))
                        || accessControlService.canSeeCase(actor, r.getACase()))
                .filter(r -> referredTo == null || referredTo.isBlank() || r.getReferredTo().equalsIgnoreCase(referredTo))
                .filter(r -> status == null || status.isBlank() || r.getStatus().equalsIgnoreCase(status))
                .sorted(Comparator.comparing(Referral::getCreatedAt).reversed())
                .map(this::toResponse)
                .collect(Collectors.toList());
        int start = Math.min((int) pageable.getOffset(), filtered.size());
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    private void requireReferralCaseAccess(User actor, Case aCase) {
        if (!accessControlService.canSeeCase(actor, aCase)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only manage referrals for cases assigned or permitted to you");
        }
    }

    private void requireReferralEditAccess(User actor, Referral referral) {
        requireReferralCaseAccess(actor, referral.getACase());
        if (accessControlService.isAdmin(actor) || accessControlService.isDistrictAdmin(actor)) {
            return;
        }
        String actorName = actor.getDisplayName();
        String actorUsername = actor.getUsername();
        if (StringUtils.hasText(referral.getReferredBy())
                && (referral.getReferredBy().equalsIgnoreCase(actorName)
                || referral.getReferredBy().equalsIgnoreCase(actorUsername))) {
            return;
        }
        throw new org.springframework.security.access.AccessDeniedException("You can only edit referrals you created");
    }

    private void requireReferralStatusAccess(User actor, Referral referral) {
        if (accessControlService.canSeeCase(actor, referral.getACase())) {
            return;
        }
        if (accessControlService.hasRole(actor, "PARTNER")
                && StringUtils.hasText(referral.getReferredTo())
                && (referral.getReferredTo().equalsIgnoreCase(actor.getInstitution())
                || referral.getReferredTo().equalsIgnoreCase(actor.getDisplayName())
                || referral.getReferredTo().equalsIgnoreCase(actor.getUsername()))) {
            return;
        }
        throw new org.springframework.security.access.AccessDeniedException("You can only update referrals assigned to you");
    }

    private ReferralResponse toResponse(Referral referral) {
        return new ReferralResponse(
                referral.getId(),
                referral.getACase().getId(),
                referral.getACase().getCaseId(),
                referral.getACase().getType(),
                referral.getACase().getVictim() != null ? referral.getACase().getVictim().getName() : null,
                referral.getReferredTo(),
                referral.getReferredBy(),
                referral.getReferredByRole(),
                referral.getInstitutionType(),
                referral.getReason(),
                referral.getUrgency(),
                referral.getStatus(),
                referral.getDateAcknowledged(),
                referral.getCreatedAt(),
                referral.getUpdatedAt()
        );
    }

    private void completeMilestone(Case aCase, String name) {
        milestoneRepository.findAll().stream()
                .filter(milestone -> milestone.getACase() != null && milestone.getACase().getId().equals(aCase.getId()))
                .filter(milestone -> milestone.getName() != null && milestone.getName().equalsIgnoreCase(name))
                .findFirst()
                .ifPresent(milestone -> {
                    if (!milestone.isCompleted()) {
                        milestone.setCompleted(true);
                        milestone.setCompletedAt(new Date());
                        milestoneRepository.save(milestone);
                    }
                });
    }
}
