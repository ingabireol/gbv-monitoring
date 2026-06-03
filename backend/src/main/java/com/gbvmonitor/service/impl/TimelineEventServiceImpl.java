package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.TimelineEventResponse;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.TimelineEvent;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.CaseRepository;
import com.gbvmonitor.repository.TimelineEventRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.service.AccessControlService;
import com.gbvmonitor.service.TimelineEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelineEventServiceImpl implements TimelineEventService {
    private final TimelineEventRepository timelineEventRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    @Override
    public List<TimelineEventResponse> getEventsByCase(UUID caseId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        accessControlService.requireCaseViewAccess(actor, aCase);
        return timelineEventRepository.findAll().stream()
                .filter(e -> e.getACase().getId().equals(aCase.getId()))
                .sorted(Comparator.comparing(TimelineEvent::getEventAt))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TimelineEventResponse> getEventsForOfficer(String username) {
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(username, username).orElseThrow();
        var assignedCaseIds = caseRepository.findByAssignedOfficer_Id(user.getId()).stream()
                .map(Case::getId)
                .collect(Collectors.toSet());

        return timelineEventRepository.findAll().stream()
                .filter(event -> assignedCaseIds.contains(event.getACase().getId()))
                .sorted(Comparator.comparing(TimelineEvent::getEventAt).reversed())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TimelineEventResponse logEvent(UUID caseId, String eventType, String description, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Case aCase = caseRepository.findById(caseId).orElseThrow();
        accessControlService.requireRecoveryManageAccess(actor, aCase);
        TimelineEvent event = TimelineEvent.builder()
                .aCase(aCase)
                .eventType(eventType)
                .description(description)
                .eventAt(new Date())
                .build();
        timelineEventRepository.save(event);
        return toResponse(event);
    }

    private TimelineEventResponse toResponse(TimelineEvent event) {
        return new TimelineEventResponse(
                event.getId(),
                event.getEventType(),
                event.getDescription(),
                event.getEventAt()
        );
    }
}
