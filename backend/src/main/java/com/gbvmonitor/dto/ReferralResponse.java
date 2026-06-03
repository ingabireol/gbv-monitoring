package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ReferralResponse {
    private UUID id;
    private UUID caseUuid;
    private String caseId;
    private String caseType;
    private String victimName;
    private String referredTo;
    private String referredBy;
    private String referredByRole;
    private String institutionType;
    private String reason;
    private String urgency;
    private String status;
    private Date dateAcknowledged;
    private Date createdAt;
    private Date updatedAt;
}
