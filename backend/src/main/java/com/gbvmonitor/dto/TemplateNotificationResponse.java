package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class TemplateNotificationResponse {
    private UUID id;
    private String name;
    private String trigger;
    private String subject;
    private String body;
    private String language;
    private String channel;
    private boolean active;
    private Date lastSent;
    private Long sentCount;
    private Date createdAt;
    private Date updatedAt;
}
