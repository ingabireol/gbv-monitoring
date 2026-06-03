package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.AuditLogResponse;
import com.gbvmonitor.entity.AuditLog;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.AuditLogRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void logAction(UUID userId, String action) {
        User user = userRepository.findById(userId).orElse(null);
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .timestamp(new Date())
                .build();
        auditLogRepository.save(log);
    }

    @Override
    public List<AuditLogResponse> getLogsByUser(UUID userId) {
        return auditLogRepository.findAll().stream()
                .filter(l -> l.getUser() != null && l.getUser().getId().equals(userId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getAction(),
                log.getTimestamp()
        );
    }
}
