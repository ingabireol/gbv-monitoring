package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.TemplateNotificationRequest;
import com.gbvmonitor.dto.TemplateNotificationResponse;
import com.gbvmonitor.entity.TemplateNotification;
import com.gbvmonitor.repository.TemplateNotificationRepository;
import com.gbvmonitor.service.TemplateNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TemplateNotificationServiceImpl implements TemplateNotificationService {
    private final TemplateNotificationRepository templateNotificationRepository;

    @Override
    public String renderTemplate(String name, Map<String, String> variables) {
        TemplateNotification template = templateNotificationRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        String result = template.getTemplate();
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }

    @Override
    public List<TemplateNotificationResponse> getTemplates() {
        return templateNotificationRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TemplateNotificationResponse createTemplate(TemplateNotificationRequest request) {
        TemplateNotification template = TemplateNotification.builder()
                .name(request.getName())
                .triggerEvent(request.getTrigger())
                .subject(request.getSubject())
                .template(request.getBody())
                .language(request.getLanguage())
                .channel(request.getChannel())
                .active(request.getActive())
                .sentCount(0L)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        return toResponse(templateNotificationRepository.save(template));
    }

    @Override
    public TemplateNotificationResponse updateTemplate(UUID id, TemplateNotificationRequest request) {
        TemplateNotification template = templateNotificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        template.setName(request.getName());
        template.setTriggerEvent(request.getTrigger());
        template.setSubject(request.getSubject());
        template.setTemplate(request.getBody());
        template.setLanguage(request.getLanguage());
        template.setChannel(request.getChannel());
        template.setActive(request.getActive());
        template.setUpdatedAt(new Date());
        return toResponse(templateNotificationRepository.save(template));
    }

    @Override
    public void deleteTemplate(UUID id) {
        templateNotificationRepository.deleteById(id);
    }

    @Override
    public TemplateNotificationResponse markTestSent(UUID id) {
        TemplateNotification template = templateNotificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        template.setLastSent(new Date());
        template.setSentCount((template.getSentCount() == null ? 0L : template.getSentCount()) + 1);
        template.setUpdatedAt(new Date());
        return toResponse(templateNotificationRepository.save(template));
    }

    private TemplateNotificationResponse toResponse(TemplateNotification template) {
        return new TemplateNotificationResponse(
                template.getId(),
                template.getName(),
                template.getTriggerEvent(),
                template.getSubject(),
                template.getTemplate(),
                template.getLanguage(),
                template.getChannel(),
                template.isActive(),
                template.getLastSent(),
                template.getSentCount(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
