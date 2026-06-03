package com.gbvmonitor.service;

import com.gbvmonitor.dto.TimelineEventResponse;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;
import java.util.UUID;

public interface TimelineEventService {
    List<TimelineEventResponse> getEventsByCase(UUID caseId, UserDetails userDetails);
    List<TimelineEventResponse> getEventsForOfficer(String username);
    TimelineEventResponse logEvent(UUID caseId, String eventType, String description, UserDetails userDetails);
}
