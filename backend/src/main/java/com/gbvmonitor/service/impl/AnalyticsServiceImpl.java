package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.AnalyticsResponse;
import com.gbvmonitor.entity.Case;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.CaseRepository;
import com.gbvmonitor.service.AccessControlService;
import com.gbvmonitor.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {
    private final CaseRepository caseRepository;
    private final AccessControlService accessControlService;

    @Override
    public AnalyticsResponse getCasesByDistrict(UserDetails userDetails) {
        List<Case> cases = visibleCases(userDetails);
        Map<String, Long> byDistrict = cases.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getVictim() != null ? c.getVictim().getAddress() : "Unknown",
                        Collectors.counting()
                ));
        Map<String, Object> data = new HashMap<>();
        data.put("casesByDistrict", byDistrict);
        return new AnalyticsResponse(data);
    }

    @Override
    public AnalyticsResponse getTrends(UserDetails userDetails) {
        // Example: group by year
        List<Case> cases = visibleCases(userDetails);
        Map<Integer, Long> byYear = cases.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCreatedAt().toInstant().atZone(java.time.ZoneId.systemDefault()).getYear(),
                        Collectors.counting()
                ));
        Map<String, Object> data = new HashMap<>();
        data.put("trends", byYear);
        return new AnalyticsResponse(data);
    }

    @Override
    public AnalyticsResponse getResolutionRate(UserDetails userDetails) {
        List<Case> cases = visibleCases(userDetails);
        long resolved = cases.stream().filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus())).count();
        double rate = cases.isEmpty() ? 0 : (double) resolved / cases.size();
        Map<String, Object> data = new HashMap<>();
        data.put("resolutionRate", rate);
        return new AnalyticsResponse(data);
    }

    private List<Case> visibleCases(UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        return caseRepository.findAll().stream()
                .filter(aCase -> !accessControlService.isDistrictAdmin(actor) || accessControlService.canSeeCase(actor, aCase))
                .toList();
    }
}
