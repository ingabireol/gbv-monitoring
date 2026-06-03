package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.AuditLogResponse;
import com.gbvmonitor.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllLogs() {
        List<AuditLogResponse> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(new ApiResponse<>(true, "All audit logs", logs));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByUser(@PathVariable UUID userId) {
        List<AuditLogResponse> logs = auditLogService.getLogsByUser(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "User audit logs", logs));
    }
}
