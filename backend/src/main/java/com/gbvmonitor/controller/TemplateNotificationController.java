package com.gbvmonitor.controller;

import com.gbvmonitor.dto.ApiResponse;
import com.gbvmonitor.dto.TemplateNotificationRequest;
import com.gbvmonitor.dto.TemplateNotificationResponse;
import com.gbvmonitor.service.TemplateNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/template-notifications")
@RequiredArgsConstructor
public class TemplateNotificationController {
    private final TemplateNotificationService templateNotificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TemplateNotificationResponse>>> getTemplates() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Templates fetched", templateNotificationService.getTemplates()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TemplateNotificationResponse>> createTemplate(@RequestBody TemplateNotificationRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Template created", templateNotificationService.createTemplate(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateNotificationResponse>> updateTemplate(
            @PathVariable UUID id,
            @RequestBody TemplateNotificationRequest request
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Template updated", templateNotificationService.updateTemplate(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        templateNotificationService.deleteTemplate(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Template deleted", null));
    }

    @PostMapping("/{id}/test-send")
    public ResponseEntity<ApiResponse<TemplateNotificationResponse>> testSend(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Test notification sent", templateNotificationService.markTestSent(id)));
    }
}
