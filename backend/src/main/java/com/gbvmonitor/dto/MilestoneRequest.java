package com.gbvmonitor.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class MilestoneRequest {
    private UUID caseId;
    private String name;
    private Boolean completed;
}
