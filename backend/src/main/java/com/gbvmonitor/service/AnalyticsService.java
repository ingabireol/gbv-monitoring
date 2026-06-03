package com.gbvmonitor.service;

import com.gbvmonitor.dto.AnalyticsResponse;
import org.springframework.security.core.userdetails.UserDetails;

public interface AnalyticsService {
    AnalyticsResponse getCasesByDistrict(UserDetails userDetails);
    AnalyticsResponse getTrends(UserDetails userDetails);
    AnalyticsResponse getResolutionRate(UserDetails userDetails);
}
