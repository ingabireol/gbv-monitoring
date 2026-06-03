package com.gbvmonitor.service;

import com.gbvmonitor.dto.ReportRequest;
import com.gbvmonitor.dto.ReportResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ReportService {
    ReportResponse createReport(ReportRequest request, String reporterUsername);
    ReportResponse createAnonymousReport(ReportRequest request);
}
