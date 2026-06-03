package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReportResponse {
    private boolean success;
    private String message;
    private String caseId;
    private String reference;
}
