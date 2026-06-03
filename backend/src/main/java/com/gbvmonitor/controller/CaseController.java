package com.gbvmonitor.controller;

import com.gbvmonitor.dto.AnonymousChatMessageResponse;
import com.gbvmonitor.dto.AnonymousChatRequest;
import com.gbvmonitor.dto.AnonymousChatResponse;
import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.CaseResponse;
import com.gbvmonitor.dto.VictimCaseUpdateRequest;
import com.gbvmonitor.entity.AnonymousChatMessage;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.Report;
import com.gbvmonitor.entity.TimelineEvent;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.AnonymousChatMessageRepository;
import com.gbvmonitor.repository.ReportRepository;
import com.gbvmonitor.repository.TimelineEventRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.service.CaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {
    private final CaseService caseService;
    private final ReportRepository reportRepository;
    private final AnonymousChatMessageRepository anonymousChatMessageRepository;
    private final UserRepository userRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AnonymousReportController anonymousReportController;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CaseResponse>>> getAllCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CaseResponse> cases = caseService.getAllCases(status, type, pageable, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cases fetched", cases));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<CaseResponse>>> getMyCases(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<CaseResponse> cases = caseService.getCasesForVictim(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(true, "Victim cases fetched", cases));
    }

    @GetMapping("/assigned/me")
    public ResponseEntity<ApiResponse<List<CaseResponse>>> getAssignedCases(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<CaseResponse> cases = caseService.getCasesForOfficer(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(true, "Officer assigned cases fetched", cases));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<CaseResponse>> assignOfficer(
            @PathVariable("id") UUID caseId,
            @RequestBody Map<String, UUID> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID officerId = body.get("officerId");
        CaseResponse response = caseService.assignOfficer(caseId, officerId, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Officer assigned", response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CaseResponse>> updateStatus(
            @PathVariable("id") UUID caseId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String status = body.get("status");
        CaseResponse response = caseService.updateStatus(caseId, status, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Status updated", response));
    }

    @PutMapping("/{id}/victim-details")
    public ResponseEntity<ApiResponse<CaseResponse>> updateVictimOpenCase(
            @PathVariable("id") UUID caseId,
            @RequestBody VictimCaseUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        CaseResponse response = caseService.updateVictimOpenCase(caseId, request, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Case details updated", response));
    }

    @PutMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<CaseResponse>> withdrawVictimOpenCase(
            @PathVariable("id") UUID caseId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        CaseResponse response = caseService.withdrawVictimOpenCase(caseId, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Case withdrawn", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCase(
            @PathVariable("id") UUID caseId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        caseService.deleteCase(caseId, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Case deleted", null));
    }

    // ── Anonymous reporter chat (officer side) ───────────────────────────────

    @GetMapping("/{id}/anonymous-chat")
    public ResponseEntity<ApiResponse<AnonymousChatResponse>> getAnonymousCaseChat(
            @PathVariable("id") UUID caseId
    ) {
        List<Report> reports = reportRepository.findByCaseIdOrderByReportedAtDesc(caseId);
        if (reports.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(false, "No anonymous report found for this case", null));
        }
        Report report = reports.get(0);
        return ResponseEntity.ok(new ApiResponse<>(true, "Chat fetched", anonymousReportController.buildChatResponse(report)));
    }

    @PostMapping("/{id}/anonymous-chat")
    public ResponseEntity<ApiResponse<AnonymousChatResponse>> sendAnonymousCaseChatMessage(
            @PathVariable("id") UUID caseId,
            @RequestBody AnonymousChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String message = request == null ? "" : request.getMessage();
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("Message is required");
        }

        List<Report> reports = reportRepository.findByCaseIdOrderByReportedAtDesc(caseId);
        if (reports.isEmpty()) {
            return ResponseEntity.ok(new ApiResponse<>(false, "No anonymous report found for this case", null));
        }
        Report report = reports.get(0);

        User officer = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        String displayName = officer != null && StringUtils.hasText(officer.getDisplayName())
                ? officer.getDisplayName()
                : userDetails.getUsername();

        anonymousChatMessageRepository.save(AnonymousChatMessage.builder()
                .report(report)
                .sender("OFFICER")
                .senderDisplayName(displayName)
                .message(message.trim())
                .createdAt(new Date())
                .build());

        if (report.getACase() != null) {
            timelineEventRepository.save(TimelineEvent.builder()
                    .aCase(report.getACase())
                    .eventType("OFFICER_CHAT_MESSAGE")
                    .description("Officer " + displayName + " replied to the anonymous reporter.")
                    .eventAt(new Date())
                    .build());
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Reply sent", anonymousReportController.buildChatResponse(report)));
    }
}
