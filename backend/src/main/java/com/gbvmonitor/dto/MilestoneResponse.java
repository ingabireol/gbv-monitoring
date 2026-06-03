package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class MilestoneResponse {
    private UUID id;
    private String name;
    private boolean completed;
    private Date completedAt;
}
