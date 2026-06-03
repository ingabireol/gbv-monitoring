package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.AnalyticsResponse;
import com.gbvmonitor.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/cases-by-district")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getCasesByDistrict(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AnalyticsResponse response = analyticsService.getCasesByDistrict(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cases by district", response));
    }

    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getTrends(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AnalyticsResponse response = analyticsService.getTrends(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Trends", response));
    }

    @GetMapping("/resolution-rate")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getResolutionRate(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AnalyticsResponse response = analyticsService.getResolutionRate(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resolution rate", response));
    }
}
