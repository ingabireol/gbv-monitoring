package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.NotificationRequest;
import com.gbvmonitor.dto.NotificationResponse;
import com.gbvmonitor.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(@RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification created", response));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotificationsByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<NotificationResponse> notifications = notificationService.getNotificationsByUser(userId, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications fetched", notifications));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        NotificationResponse response = notificationService.markAsRead(id, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification marked as read", response));
    }
}
