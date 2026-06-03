package com.gbvmonitor.service;

import com.gbvmonitor.dto.AuditLogResponse;
import java.util.List;
import java.util.UUID;

public interface AuditLogService {
    void logAction(UUID userId, String action);
    List<AuditLogResponse> getLogsByUser(UUID userId);
    List<AuditLogResponse> getAllLogs();
}
