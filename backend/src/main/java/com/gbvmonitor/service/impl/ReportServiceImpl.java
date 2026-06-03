package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.ReportRequest;
import com.gbvmonitor.dto.ReportResponse;
import com.gbvmonitor.entity.*;
import com.gbvmonitor.repository.*;
import com.gbvmonitor.service.FileStorageService;
import com.gbvmonitor.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final CaseRepository caseRepository;
    private final VictimRepository victimRepository;
    private final ReportRepository reportRepository;
    private final EvidenceFileRepository evidenceFileRepository;
    private final UserRepository userRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final MilestoneRepository milestoneRepository;
    private final NotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public ReportResponse createReport(ReportRequest request, String reporterUsername) {
        return createReportInternal(request, reporterUsername, false);
    }

    @Override
    @Transactional
    public ReportResponse createAnonymousReport(ReportRequest request) {
        return createReportInternal(request, null, true);
    }

    private ReportResponse createReportInternal(ReportRequest request, String reporterUsername, boolean anonymous) {
        Date incidentAt = resolveIncidentAt(request);
        String submissionKey = firstNonBlank(request.getSubmissionKey());
        if (submissionKey != null) {
            var existingReport = reportRepository.findBySubmissionKey(submissionKey);
            if (existingReport.isPresent()) {
                Report report = existingReport.get();
                return new ReportResponse(
                        true,
                        "Report submitted successfully",
                        report.getACase() != null ? report.getACase().getCaseId() : null,
                        report.getReference()
                );
            }
        }

        User reporter = anonymous || reporterUsername == null
                ? null
                : userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(reporterUsername, reporterUsername).orElseThrow();

        Victim victim = resolveVictimProfile(request, reporter, anonymous);
        victimRepository.save(victim);

        String prefix = resolveCasePrefix(request.getType(), anonymous);
        String caseId = String.format("%s-%d-%04d", prefix, java.time.Year.now().getValue(), (int)(Math.random()*10000));
        Case aCase = Case.builder()
                .caseId(caseId)
                .type(prefix)
                .status("FILED")
                .victim(victim)
                .createdAt(new Date())
                .build();
        caseRepository.save(aCase);

        // Report
        String reference = String.format("%s-%d-%04d", prefix, java.time.Year.now().getValue(), (int)(Math.random()*10000));
        Report report = Report.builder()
                .reference(reference)
                .aCase(aCase)
                .reportType(anonymous ? "Anonymous" : "Authenticated")
                .reportedAt(new Date())
                .description(request.getDescription())
                .incidentAt(incidentAt)
                .incidentLocation(firstNonBlank(request.getIncidentLocation(), request.getVictimAddress()))
                .reporterName(firstNonBlank(request.getReporterName()))
                .reporterContact(firstNonBlank(request.getReporterContact()))
                .witnessName(firstNonBlank(request.getWitnessName()))
                .witnessContact(firstNonBlank(request.getWitnessContact()))
                .witnessLocation(firstNonBlank(request.getWitnessLocation()))
                .witnessStatement(firstNonBlank(request.getWitnessStatement()))
                .submissionKey(submissionKey)
                .build();
        reportRepository.save(report);
        seedInitialCaseData(aCase, victim, reporter, request, anonymous);

        if (request.getFiles() != null) {
            for (MultipartFile file : request.getFiles()) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                try {
                    String fileUrl = fileStorageService.storeFile(file);
                    EvidenceFile evidenceFile = EvidenceFile.builder()
                            .aCase(aCase)
                            .fileName(firstNonBlank(file.getOriginalFilename(), "uploaded-file"))
                            .fileType(firstNonBlank(file.getContentType(), "application/octet-stream"))
                            .fileUrl(fileUrl)
                            .uploadedAt(new Date())
                            .build();
                    evidenceFileRepository.save(evidenceFile);
                } catch (IOException e) {
                    // Log error, skip file
                }
            }
        }
        return new ReportResponse(true, "Report submitted successfully", aCase.getCaseId(), report.getReference());
    }

    private Date resolveIncidentAt(ReportRequest request) {
        String dateValue = firstNonBlank(request.getIncidentDate());
        if (dateValue == null) {
            return null;
        }

        try {
            LocalDate incidentDate = LocalDate.parse(dateValue);
            LocalTime incidentTime = firstNonBlank(request.getIncidentTime()) == null
                    ? LocalTime.MIDNIGHT
                    : LocalTime.parse(request.getIncidentTime());
            LocalDateTime incidentAt = LocalDateTime.of(incidentDate, incidentTime);
            if (incidentAt.isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Incident date and time cannot be in the future");
            }
            return Date.from(incidentAt.atZone(ZoneId.systemDefault()).toInstant());
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Incident date or time is invalid");
        }
    }

    private Victim resolveVictimProfile(ReportRequest request, User reporter, boolean anonymous) {
        Victim victim = reporter == null
                ? Victim.builder().build()
                : victimRepository.findByAccountId(reporter.getId())
                        .orElseGet(() -> Victim.builder().account(reporter).build());

        String fallbackName = anonymous
                ? "Anonymous Reporter"
                : firstNonBlank(reporter != null ? reporter.getDisplayName() : null, reporter != null ? reporter.getUsername() : null);

        victim.setName(firstNonBlank(request.getVictimName(), victim.getName(), fallbackName));
        victim.setGender(firstNonBlank(request.getVictimGender(), victim.getGender()));
        victim.setAge(request.getVictimAge() != null ? request.getVictimAge() : victim.getAge());
        victim.setAddress(firstNonBlank(
                request.getVictimAddress(),
                victim.getAddress(),
                reporter != null ? reporter.getDistrict() : null
        ));
        if (reporter != null) {
            victim.setAccount(reporter);
        }

        return victim;
    }

    private String resolveCasePrefix(String requestedType, boolean anonymous) {
        if (anonymous) {
            return "ANON";
        }
        if (requestedType == null || requestedType.isBlank()) {
            return "GBV";
        }

        String normalized = requestedType.trim()
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_')
                .replace('/', '_');

        return switch (normalized) {
            case "CA", "CHILD_NEGLECT", "CHILD_LABOR", "EARLY_MARRIAGE", "CHILD_ABUSE" -> "CA";
            default -> "GBV";
        };
    }

    private void seedInitialCaseData(Case aCase, Victim victim, User reporter, ReportRequest request, boolean anonymous) {
        Date now = new Date();

        timelineEventRepository.save(TimelineEvent.builder()
                .aCase(aCase)
                .eventType("CASE_FILED")
                .description(buildInitialTimelineDescription(aCase, request))
                .eventAt(now)
                .build());

        milestoneRepository.save(Milestone.builder()
                .aCase(aCase)
                .name("Filed")
                .completed(true)
                .completedAt(now)
                .build());
        milestoneRepository.save(Milestone.builder()
                .aCase(aCase)
                .name("Assigned")
                .completed(false)
                .build());
        milestoneRepository.save(Milestone.builder()
                .aCase(aCase)
                .name("Investigation")
                .completed(false)
                .build());
        milestoneRepository.save(Milestone.builder()
                .aCase(aCase)
                .name("Support")
                .completed(false)
                .build());
        milestoneRepository.save(Milestone.builder()
                .aCase(aCase)
                .name("Resolved")
                .completed(false)
                .build());

        if (!anonymous && reporter != null) {
            notificationRepository.save(Notification.builder()
                    .user(reporter)
                    .type("CASE_REGISTERED")
                    .message(String.format(
                            "Your report has been received and case %s was created for %s.",
                            aCase.getCaseId(),
                            firstNonBlank(victim.getName(), "your account")
                    ))
                    .read(false)
                    .createdAt(now)
                    .build());
        }
    }

    private String buildInitialTimelineDescription(Case aCase, ReportRequest request) {
        String incidentType = firstNonBlank(request.getType(), "GBV");
        String location = firstNonBlank(request.getVictimAddress(), "the selected district");
        return String.format(
                "Case %s was registered for %s and is waiting for assignment. Reported location: %s.",
                aCase.getCaseId(),
                incidentType,
                location
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
