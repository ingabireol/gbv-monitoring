package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AuditLogResponse {
    private UUID id;
    private UUID userId;
    private String action;
    private Date timestamp;
}
