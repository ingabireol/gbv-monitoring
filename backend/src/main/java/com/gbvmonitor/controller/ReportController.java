package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.ReportRequest;
import com.gbvmonitor.dto.ReportResponse;
import com.gbvmonitor.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @ModelAttribute ReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Authentication is required to create a report", null));
        }
        ReportResponse response = reportService.createReport(request, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(true, "Report created", response));
    }

    @PostMapping(value = "/anonymous", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ReportResponse>> createAnonymousReport(
            @ModelAttribute ReportRequest request
    ) {
        ReportResponse response = reportService.createAnonymousReport(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Anonymous report created", response));
    }

    // TODO: GET /api/reports/{id}
}
