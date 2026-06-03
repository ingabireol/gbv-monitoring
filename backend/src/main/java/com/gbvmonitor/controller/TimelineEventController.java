package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.TimelineEventResponse;
import com.gbvmonitor.service.TimelineEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/timeline-events")
@RequiredArgsConstructor
public class TimelineEventController {
    private final TimelineEventService timelineEventService;

    @GetMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<List<TimelineEventResponse>>> getEventsByCase(
            @PathVariable UUID caseId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<TimelineEventResponse> events = timelineEventService.getEventsByCase(caseId, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Timeline events fetched", events));
    }

    @GetMapping("/assigned/me")
    public ResponseEntity<ApiResponse<List<TimelineEventResponse>>> getEventsForOfficer(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<TimelineEventResponse> events = timelineEventService.getEventsForOfficer(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(true, "Officer timeline events fetched", events));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimelineEventResponse>> logEvent(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID caseId = UUID.fromString((String) body.get("caseId"));
        String eventType = (String) body.get("eventType");
        String description = (String) body.get("description");
        TimelineEventResponse response = timelineEventService.logEvent(caseId, eventType, description, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Event logged", response));
    }
}
