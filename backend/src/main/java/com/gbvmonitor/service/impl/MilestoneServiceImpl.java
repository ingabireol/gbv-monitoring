package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.MilestoneRequest;
import com.gbvmonitor.dto.MilestoneResponse;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.Milestone;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.CaseRepository;
import com.gbvmonitor.repository.MilestoneRepository;
import com.gbvmonitor.repository.ReferralRepository;
import com.gbvmonitor.service.AccessControlService;
import com.gbvmonitor.service.MilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class MilestoneServiceImpl implements MilestoneService {
    private final MilestoneRepository milestoneRepository;
    private final CaseRepository caseRepository;
    private final ReferralRepository referralRepository;
    private final AccessControlService accessControlService;

    @Override
    @Transactional
    public List<MilestoneResponse> getMilestonesByCase(UUID caseId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        accessControlService.requireCaseViewAccess(actor, aCase);
        syncMilestonesWithCase(aCase);
        return findCaseMilestones(aCase).stream()
                .sorted(Comparator.comparing(Milestone::getCompletedAt, Comparator.nullsLast(Date::compareTo)))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MilestoneResponse addMilestone(MilestoneRequest request, UserDetails userDetails) {
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Milestone name is required");
        }
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(request.getCaseId()).orElseThrow();
        accessControlService.requireRecoveryManageAccess(actor, aCase);
        Milestone milestone = Milestone.builder()
                .aCase(aCase)
                .name(request.getName().trim())
                .completed(false)
                .build();
        milestoneRepository.save(milestone);
        return toResponse(milestone);
    }

    @Override
    @Transactional
    public MilestoneResponse updateMilestone(UUID milestoneId, MilestoneRequest request, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Milestone milestone = milestoneRepository.findById(milestoneId).orElseThrow();
        accessControlService.requireRecoveryManageAccess(actor, milestone.getACase());
        if (StringUtils.hasText(request.getName())) {
            milestone.setName(request.getName().trim());
        }
        if (request.getCompleted() != null) {
            milestone.setCompleted(request.getCompleted());
            milestone.setCompletedAt(request.getCompleted() ? new Date() : null);
        }
        milestoneRepository.save(milestone);
        return toResponse(milestone);
    }

    @Override
    @Transactional
    public MilestoneResponse completeMilestone(UUID milestoneId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Milestone milestone = milestoneRepository.findById(milestoneId).orElseThrow();
        accessControlService.requireRecoveryManageAccess(actor, milestone.getACase());
        milestone.setCompleted(true);
        milestone.setCompletedAt(new Date());
        milestoneRepository.save(milestone);
        return toResponse(milestone);
    }

    @Override
    @Transactional
    public void deleteMilestone(UUID milestoneId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Milestone milestone = milestoneRepository.findById(milestoneId).orElseThrow();
        accessControlService.requireRecoveryManageAccess(actor, milestone.getACase());
        milestoneRepository.delete(milestone);
    }

    private void syncMilestonesWithCase(Case aCase) {
        List<Milestone> milestones = findCaseMilestones(aCase);
        if (milestones.isEmpty()) {
            seedDefaultMilestones(aCase);
            milestones = findCaseMilestones(aCase);
        }

        Date filedAt = aCase.getCreatedAt() != null ? aCase.getCreatedAt() : new Date();
        completeMilestoneIfPresent(milestones, "Filed", filedAt);

        if (aCase.getAssignedOfficer() != null || hasStatus(aCase, "ASSIGNED", "UNDER_REVIEW", "IN_REVIEW", "IN_PROGRESS", "INVESTIGATION", "UNDER_INVESTIGATION", "SUPPORT", "RESOLVED", "CLOSED", "COMPLETED")) {
            completeMilestoneIfPresent(milestones, "Assigned", new Date());
        }
        if (hasStatus(aCase, "IN_PROGRESS", "INVESTIGATION", "UNDER_INVESTIGATION", "SUPPORT", "RESOLVED", "CLOSED", "COMPLETED")) {
            completeMilestoneIfPresent(milestones, "Investigation", new Date());
        }
        if (hasReferral(aCase) || hasStatus(aCase, "SUPPORT", "RESOLVED", "CLOSED", "COMPLETED")) {
            completeMilestoneIfPresent(milestones, "Support", new Date());
        }
        if (hasStatus(aCase, "RESOLVED", "CLOSED", "COMPLETED")) {
            completeMilestoneIfPresent(milestones, "Resolved", new Date());
        }
    }

    private List<Milestone> findCaseMilestones(Case aCase) {
        return milestoneRepository.findAll().stream()
                .filter(m -> m.getACase() != null && m.getACase().getId().equals(aCase.getId()))
                .collect(Collectors.toList());
    }

    private void seedDefaultMilestones(Case aCase) {
        Date filedAt = aCase.getCreatedAt() != null ? aCase.getCreatedAt() : new Date();
        milestoneRepository.save(Milestone.builder()
                .aCase(aCase)
                .name("Filed")
                .completed(true)
                .completedAt(filedAt)
                .build());
        milestoneRepository.save(Milestone.builder().aCase(aCase).name("Assigned").completed(false).build());
        milestoneRepository.save(Milestone.builder().aCase(aCase).name("Investigation").completed(false).build());
        milestoneRepository.save(Milestone.builder().aCase(aCase).name("Support").completed(false).build());
        milestoneRepository.save(Milestone.builder().aCase(aCase).name("Resolved").completed(false).build());
    }

    private void completeMilestoneIfPresent(List<Milestone> milestones, String name, Date completedAt) {
        milestones.stream()
                .filter(m -> name.equalsIgnoreCase(m.getName()))
                .filter(m -> !m.isCompleted())
                .forEach(m -> {
                    m.setCompleted(true);
                    m.setCompletedAt(completedAt);
                    milestoneRepository.save(m);
                });
    }

    private boolean hasReferral(Case aCase) {
        return referralRepository.findAll().stream()
                .anyMatch(referral -> referral.getACase() != null
                        && referral.getACase().getId().equals(aCase.getId()));
    }

    private boolean hasStatus(Case aCase, String... statuses) {
        if (aCase.getStatus() == null) {
            return false;
        }
        String currentStatus = aCase.getStatus().trim().toUpperCase();
        for (String status : statuses) {
            if (status.equals(currentStatus)) {
                return true;
            }
        }
        return false;
    }

    private MilestoneResponse toResponse(Milestone milestone) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getName(),
                milestone.isCompleted(),
                milestone.getCompletedAt()
        );
    }
}
