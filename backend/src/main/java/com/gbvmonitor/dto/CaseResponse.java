package com.gbvmonitor.dto;

import com.gbvmonitor.entity.User;
import com.gbvmonitor.entity.Victim;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class CaseResponse {
    private UUID id;
    private String caseId;
    private String type;
    private String status;
    private Victim victim;
    private UUID victimAccountId;
    private String victimDistrict;
    private User assignedOfficer;
    private Date createdAt;
    private Date updatedAt;
    private String reportType;
    private Date incidentAt;
    private String incidentLocation;
    private String reporterName;
    private String reporterContact;
    private String witnessName;
    private String witnessContact;
    private String witnessLocation;
}
