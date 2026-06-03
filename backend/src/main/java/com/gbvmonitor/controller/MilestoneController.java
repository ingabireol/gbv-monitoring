package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.MilestoneRequest;
import com.gbvmonitor.dto.MilestoneResponse;
import com.gbvmonitor.service.MilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {
    private final MilestoneService milestoneService;

    @GetMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<List<MilestoneResponse>>> getMilestonesByCase(
            @PathVariable UUID caseId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<MilestoneResponse> milestones = milestoneService.getMilestonesByCase(caseId, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milestones fetched", milestones));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MilestoneResponse>> addMilestone(
            @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        MilestoneResponse response = milestoneService.addMilestone(request, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milestone added", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MilestoneResponse>> updateMilestone(
            @PathVariable UUID id,
            @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        MilestoneResponse response = milestoneService.updateMilestone(id, request, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milestone updated", response));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<MilestoneResponse>> completeMilestone(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        MilestoneResponse response = milestoneService.completeMilestone(id, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milestone completed", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMilestone(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        milestoneService.deleteMilestone(id, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milestone deleted", null));
    }
}
