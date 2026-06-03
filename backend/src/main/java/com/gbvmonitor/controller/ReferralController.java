package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.ReferralRequest;
import com.gbvmonitor.dto.ReferralResponse;
import com.gbvmonitor.service.ReferralService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
public class ReferralController {
    private final ReferralService referralService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReferralResponse>> createReferral(
            @RequestBody ReferralRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReferralResponse response = referralService.createReferral(request, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Referral created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReferralResponse>> updateReferral(
            @PathVariable("id") UUID referralId,
            @RequestBody ReferralRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReferralResponse response = referralService.updateReferral(referralId, request, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Referral updated", response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ReferralResponse>> updateReferralStatus(
            @PathVariable("id") UUID referralId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String status = body.get("status");
        ReferralResponse response = referralService.updateReferralStatus(referralId, status, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Referral status updated", response));
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<Page<ReferralResponse>>> getReferralsByCase(
            @PathVariable UUID caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReferralResponse> referrals = referralService.getReferralsByCase(caseId, pageable, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Referrals fetched", referrals));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReferralResponse>>> getReferrals(
            @RequestParam(required = false) String referredTo,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReferralResponse> referrals = referralService.getReferrals(referredTo, status, pageable, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Referrals fetched", referrals));
    }
}
