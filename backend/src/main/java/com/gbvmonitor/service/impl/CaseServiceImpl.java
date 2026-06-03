package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.CaseResponse;
import com.gbvmonitor.dto.VictimCaseUpdateRequest;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.Report;
import com.gbvmonitor.entity.TimelineEvent;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.CaseRepository;
import com.gbvmonitor.repository.EvidenceFileRepository;
import com.gbvmonitor.repository.MilestoneRepository;
import com.gbvmonitor.repository.ReferralRepository;
import com.gbvmonitor.repository.ReportRepository;
import com.gbvmonitor.repository.TimelineEventRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.repository.NotificationRepository;
import com.gbvmonitor.repository.AnonymousChatMessageRepository;
import com.gbvmonitor.service.AccessControlService;
import com.gbvmonitor.service.CaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CaseServiceImpl implements CaseService {
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final EvidenceFileRepository evidenceFileRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final MilestoneRepository milestoneRepository;
    private final ReferralRepository referralRepository;
    private final NotificationRepository notificationRepository;
    private final AnonymousChatMessageRepository anonymousChatMessageRepository;
    private final AccessControlService accessControlService;

    @Override
    public Page<CaseResponse> getAllCases(String status, String type, Pageable pageable, UserDetails userDetails) {
        User user = accessControlService.currentUser(userDetails);

        java.util.List<CaseResponse> filtered = caseRepository.findAll().stream()
            .filter(aCase -> accessControlService.canSeeCase(user, aCase))
            .map(this::toResponse)
            .filter(cr -> (status == null || status.isEmpty() || cr.getStatus().equalsIgnoreCase(status)))
            .filter(cr -> (type == null || type.isEmpty() || cr.getType().equalsIgnoreCase(type)))
            .toList();
        int start = Math.min((int) pageable.getOffset(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Override
    public List<CaseResponse> getCasesForVictim(String username) {
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(username, username).orElseThrow();
        return caseRepository.findByVictim_Account_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<CaseResponse> getCasesForOfficer(String username) {
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(username, username).orElseThrow();
        return caseRepository.findByAssignedOfficer_Id(user.getId()).stream()
                .sorted((left, right) -> {
                    java.util.Date leftDate = left.getUpdatedAt() != null ? left.getUpdatedAt() : left.getCreatedAt();
                    java.util.Date rightDate = right.getUpdatedAt() != null ? right.getUpdatedAt() : right.getCreatedAt();
                    if (leftDate == null && rightDate == null) {
                        return 0;
                    }
                    if (leftDate == null) {
                        return 1;
                    }
                    if (rightDate == null) {
                        return -1;
                    }
                    return rightDate.compareTo(leftDate);
                })
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CaseResponse assignOfficer(UUID caseId, UUID officerId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        if (accessControlService.isAdmin(actor) || accessControlService.isDistrictAdmin(actor)) {
            accessControlService.requireCaseAccess(actor, aCase);
        }
        User officer = userRepository.findById(officerId).orElseThrow();
        accessControlService.requireOfficerMatchesCase(officer, aCase);
        if (accessControlService.isAdmin(actor) || accessControlService.isDistrictAdmin(actor)) {
            accessControlService.requireAssignableOfficer(actor, officer);
        }
        aCase.setAssignedOfficer(officer);
        if (aCase.getStatus() == null || aCase.getStatus().equalsIgnoreCase("FILED") || aCase.getStatus().equalsIgnoreCase("PENDING")) {
            aCase.setStatus("ASSIGNED");
        }
        aCase.setUpdatedAt(new java.util.Date());
        caseRepository.save(aCase);
        completeMilestone(aCase, "Assigned");
        logCaseEvent(aCase, "OFFICER_ASSIGNED", "An officer was assigned to this case.");
        notificationRepository.save(com.gbvmonitor.entity.Notification.builder()
                .user(officer)
                .type("CASE_ASSIGNED")
                .message(String.format("Case %s has been assigned to you. Please review and accept or reject it.", aCase.getCaseId()))
                .read(false)
                .createdAt(new java.util.Date())
                .build());
        return toResponse(aCase);
    }

    @Override
    @Transactional
    public CaseResponse updateStatus(UUID caseId, String status, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        if (accessControlService.isAdmin(actor) || accessControlService.isDistrictAdmin(actor)) {
            accessControlService.requireCaseAccess(actor, aCase);
        } else if (accessControlService.hasRole(actor, "POLICE")) {
            if (aCase.getAssignedOfficer() == null || !aCase.getAssignedOfficer().getId().equals(actor.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Police can only update assigned cases");
            }
        } else {
            throw new org.springframework.security.access.AccessDeniedException("You cannot update case status from this endpoint");
        }
        aCase.setStatus(status);
        aCase.setUpdatedAt(new java.util.Date());
        caseRepository.save(aCase);
        advanceMilestonesForStatus(aCase, status);
        logCaseEvent(aCase, "CASE_STATUS_UPDATED", "Case status changed to " + status + ".");
        return toResponse(aCase);
    }

    @Override
    @Transactional
    public CaseResponse updateVictimOpenCase(UUID caseId, VictimCaseUpdateRequest request, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = requireVictimOwnOpenCase(caseId, actor);
        if (request != null && StringUtils.hasText(request.getVictimAddress()) && aCase.getVictim() != null) {
            aCase.getVictim().setAddress(request.getVictimAddress().trim());
        }
        aCase.setUpdatedAt(new java.util.Date());
        caseRepository.save(aCase);
        logCaseEvent(aCase, "VICTIM_CASE_UPDATED", "The victim updated case details while the case was still open.");
        return toResponse(aCase);
    }

    @Override
    @Transactional
    public CaseResponse withdrawVictimOpenCase(UUID caseId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = requireVictimOwnOpenCase(caseId, actor);
        aCase.setStatus("WITHDRAWN");
        aCase.setUpdatedAt(new java.util.Date());
        caseRepository.save(aCase);
        logCaseEvent(aCase, "CASE_WITHDRAWN", "The victim withdrew this case while it was still open.");
        return toResponse(aCase);
    }

    @Override
    @Transactional
    public void deleteCase(UUID caseId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        if (accessControlService.isAdmin(actor) || accessControlService.isDistrictAdmin(actor)) {
            accessControlService.requireCaseAccess(actor, aCase);
        } else if (accessControlService.hasRole(actor, "VICTIM")) {
            requireVictimOwnOpenCase(caseId, actor);
        } else {
            throw new org.springframework.security.access.AccessDeniedException("You cannot delete this case");
        }
        referralRepository.deleteByCaseId(caseId);
        evidenceFileRepository.deleteByCaseId(caseId);
        anonymousChatMessageRepository.deleteByReport_ACase_Id(caseId);
        reportRepository.deleteByCaseId(caseId);
        timelineEventRepository.deleteByCaseId(caseId);
        milestoneRepository.deleteByCaseId(caseId);
        caseRepository.delete(aCase);
    }

    private Case requireVictimOwnOpenCase(UUID caseId, User actor) {
        if (!accessControlService.hasRole(actor, "VICTIM")) {
            throw new org.springframework.security.access.AccessDeniedException("Only victims can manage their own open case here");
        }
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        if (aCase.getVictim() == null
                || aCase.getVictim().getAccount() == null
                || !aCase.getVictim().getAccount().getId().equals(actor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only manage your own case");
        }
        if (!isOpenForVictimChanges(aCase)) {
            throw new IllegalArgumentException("Only open cases can be edited, withdrawn, or deleted");
        }
        return aCase;
    }

    private boolean isOpenForVictimChanges(Case aCase) {
        String normalized = aCase.getStatus() == null ? "" : aCase.getStatus().trim().toUpperCase();
        return !normalized.equals("RESOLVED")
                && !normalized.equals("CLOSED")
                && !normalized.equals("WITHDRAWN");
    }

    private void logCaseEvent(Case aCase, String eventType, String description) {
        timelineEventRepository.save(TimelineEvent.builder()
                .aCase(aCase)
                .eventType(eventType)
                .description(description)
                .eventAt(new java.util.Date())
                .build());
    }

    private void advanceMilestonesForStatus(Case aCase, String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        switch (normalized) {
            case "ASSIGNED" -> completeMilestone(aCase, "Assigned");
            case "INVESTIGATION", "IN_PROGRESS" -> {
                completeMilestone(aCase, "Assigned");
                completeMilestone(aCase, "Investigation");
            }
            case "SUPPORT" -> {
                completeMilestone(aCase, "Assigned");
                completeMilestone(aCase, "Investigation");
                completeMilestone(aCase, "Support");
            }
            case "RESOLVED", "CLOSED" -> {
                completeMilestone(aCase, "Assigned");
                completeMilestone(aCase, "Investigation");
                completeMilestone(aCase, "Support");
                completeMilestone(aCase, "Resolved");
            }
            default -> {
            }
        }
    }

    private void completeMilestone(Case aCase, String name) {
        milestoneRepository.findAll().stream()
                .filter(milestone -> milestone.getACase() != null && milestone.getACase().getId().equals(aCase.getId()))
                .filter(milestone -> milestone.getName() != null && milestone.getName().equalsIgnoreCase(name))
                .findFirst()
                .ifPresent(milestone -> {
                    if (!milestone.isCompleted()) {
                        milestone.setCompleted(true);
                        milestone.setCompletedAt(new java.util.Date());
                        milestoneRepository.save(milestone);
                    }
                });
    }

    private CaseResponse toResponse(Case aCase) {
        Report report = reportRepository.findByCaseIdOrderByReportedAtDesc(aCase.getId()).stream()
                .findFirst()
                .orElse(null);
        return new CaseResponse(
                aCase.getId(),
                aCase.getCaseId(),
                aCase.getType(),
                aCase.getStatus(),
                aCase.getVictim(),
                aCase.getVictim() != null && aCase.getVictim().getAccount() != null ? aCase.getVictim().getAccount().getId() : null,
                aCase.getVictim() != null && aCase.getVictim().getAccount() != null ? aCase.getVictim().getAccount().getDistrict() : null,
                aCase.getAssignedOfficer(),
                aCase.getCreatedAt(),
                aCase.getUpdatedAt(),
                report != null ? report.getReportType() : null,
                report != null ? report.getIncidentAt() : null,
                report != null ? report.getIncidentLocation() : null,
                report != null ? report.getReporterName() : null,
                report != null ? report.getReporterContact() : null,
                report != null ? report.getWitnessName() : null,
                report != null ? report.getWitnessContact() : null,
                report != null ? report.getWitnessLocation() : null
        );
    }
}
