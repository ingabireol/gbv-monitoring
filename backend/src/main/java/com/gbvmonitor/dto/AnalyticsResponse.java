package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class AnalyticsResponse {
    private Map<String, Object> data;
}
