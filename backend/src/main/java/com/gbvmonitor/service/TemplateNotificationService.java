package com.gbvmonitor.service;

import com.gbvmonitor.dto.TemplateNotificationRequest;
import com.gbvmonitor.dto.TemplateNotificationResponse;

import java.util.List;
import java.util.UUID;

public interface TemplateNotificationService {
    String renderTemplate(String name, java.util.Map<String, String> variables);
    List<TemplateNotificationResponse> getTemplates();
    TemplateNotificationResponse createTemplate(TemplateNotificationRequest request);
    TemplateNotificationResponse updateTemplate(UUID id, TemplateNotificationRequest request);
    void deleteTemplate(UUID id);
    TemplateNotificationResponse markTestSent(UUID id);
}
