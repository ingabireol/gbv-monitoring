package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private String type;
    private String message;
    private boolean read;
    private Date createdAt;
}
