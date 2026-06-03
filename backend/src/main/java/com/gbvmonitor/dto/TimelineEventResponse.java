package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class TimelineEventResponse {
    private UUID id;
    private String eventType;
    private String description;
    private Date eventAt;
}
