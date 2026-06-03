package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.AnonymousChatMessageResponse;
import com.gbvmonitor.dto.AnonymousChatRequest;
import com.gbvmonitor.dto.AnonymousChatResponse;
import com.gbvmonitor.dto.ReportRequest;
import com.gbvmonitor.entity.AnonymousChatMessage;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.Report;
import com.gbvmonitor.entity.TimelineEvent;
import com.gbvmonitor.repository.AnonymousChatMessageRepository;
import com.gbvmonitor.repository.ReportRepository;
import com.gbvmonitor.repository.TimelineEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
@RequestMapping("/api/anonymous")
@RequiredArgsConstructor
public class AnonymousReportController {
    private final ReportRepository reportRepository;
    private final AnonymousChatMessageRepository anonymousChatMessageRepository;
    private final TimelineEventRepository timelineEventRepository;

    @GetMapping("/{ref}")
    public ResponseEntity<ApiResponse<Report>> getAnonymousReport(@PathVariable String ref) {
        Report report = findAnonymousReport(ref);
        if (report == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Not found", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Anonymous report found", report));
    }

    @GetMapping("/{ref}/chat")
    public ResponseEntity<ApiResponse<AnonymousChatResponse>> getAnonymousChat(@PathVariable String ref) {
        Report report = findAnonymousReport(ref);
        if (report == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Not found", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Anonymous chat fetched", buildChatResponse(report)));
    }

    @PostMapping("/{ref}/chat")
    public ResponseEntity<ApiResponse<AnonymousChatResponse>> sendAnonymousChatMessage(
            @PathVariable String ref,
            @RequestBody AnonymousChatRequest request
    ) {
        Report report = findAnonymousReport(ref);
        if (report == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Not found", null));
        }

        String message = request == null ? "" : request.getMessage();
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("Message is required");
        }

        anonymousChatMessageRepository.save(AnonymousChatMessage.builder()
                .report(report)
                .sender("REPORTER")
                .senderDisplayName("Anonymous Reporter")
                .message(message.trim())
                .createdAt(new Date())
                .build());

        logTimelineEvent(report, "Anonymous reporter sent a message.");

        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", buildChatResponse(report)));
    }

    @PutMapping("/{ref}/contact-details")
    public ResponseEntity<ApiResponse<Report>> updateAnonymousContactDetails(
            @PathVariable String ref,
            @RequestBody ReportRequest request
    ) {
        Report report = findAnonymousReport(ref);
        if (report == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Not found", null));
        }

        if (request.getReporterName() != null) report.setReporterName(request.getReporterName().trim());
        if (request.getReporterContact() != null) report.setReporterContact(request.getReporterContact().trim());
        if (request.getIncidentLocation() != null) report.setIncidentLocation(request.getIncidentLocation().trim());
        if (request.getWitnessName() != null) report.setWitnessName(request.getWitnessName().trim());
        if (request.getWitnessContact() != null) report.setWitnessContact(request.getWitnessContact().trim());
        if (request.getWitnessLocation() != null) report.setWitnessLocation(request.getWitnessLocation().trim());

        reportRepository.save(report);
        return ResponseEntity.ok(new ApiResponse<>(true, "Anonymous follow-up details saved", report));
    }

    private Report findAnonymousReport(String ref) {
        String lookup = ref == null ? "" : ref.trim();
        if (!StringUtils.hasText(lookup)) return null;
        return reportRepository.findAnonymousByReferenceOrCaseId(lookup, "Anonymous").orElse(null);
    }

    AnonymousChatResponse buildChatResponse(Report report) {
        Case aCase = report.getACase();
        String officerName = aCase != null && aCase.getAssignedOfficer() != null
                ? aCase.getAssignedOfficer().getDisplayName()
                : null;

        return new AnonymousChatResponse(
                report.getReference(),
                aCase != null ? aCase.getCaseId() : null,
                officerName,
                anonymousChatMessageRepository.findByReport_IdOrderByCreatedAtAsc(report.getId()).stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    AnonymousChatMessageResponse toResponse(AnonymousChatMessage msg) {
        return new AnonymousChatMessageResponse(
                msg.getId(),
                msg.getSender(),
                msg.getSenderDisplayName(),
                msg.getMessage(),
                msg.getCreatedAt()
        );
    }

    private void logTimelineEvent(Report report, String description) {
        if (report.getACase() == null) return;
        timelineEventRepository.save(TimelineEvent.builder()
                .aCase(report.getACase())
                .eventType("ANONYMOUS_CHAT_MESSAGE")
                .description(description)
                .eventAt(new Date())
                .build());
    }
}
