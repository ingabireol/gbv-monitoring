package com.gbvmonitor.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class ReportRequest {
    private String type; // GBV, CA, ANON
    private String description;
    private String incidentDate;
    private String incidentTime;
    private String incidentLocation;
    private String reporterName;
    private String reporterContact;
    private String victimName;
    private String victimGender;
    private Integer victimAge;
    private String victimAddress;
    private String witnessName;
    private String witnessContact;
    private String witnessLocation;
    private String witnessStatement;
    private String submissionKey;
    private List<MultipartFile> files;
}
