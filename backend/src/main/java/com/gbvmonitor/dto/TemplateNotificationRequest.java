package com.gbvmonitor.dto;

import lombok.Data;

@Data
public class TemplateNotificationRequest {
    private String name;
    private String trigger;
    private String subject;
    private String body;
    private String language;
    private String channel;
    private Boolean active;
}
