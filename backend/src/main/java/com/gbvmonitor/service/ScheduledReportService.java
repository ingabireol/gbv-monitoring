package com.gbvmonitor.service;

public interface ScheduledReportService {
    void generateMonthlyReport();
    void sendWeeklyAlerts();
}
