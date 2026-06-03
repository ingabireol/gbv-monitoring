package com.gbvmonitor.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ReferralRequest {
    private UUID caseId;
    private String referredTo;
    private String referredBy;
    private String referredByRole;
    private String institutionType;
    private String reason;
    private String urgency;
}
