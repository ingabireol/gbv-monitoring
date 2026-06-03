package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AnonymousChatResponse {
    private String reference;
    private String caseId;
    private String assignedOfficerName;
    private List<AnonymousChatMessageResponse> messages;
}
