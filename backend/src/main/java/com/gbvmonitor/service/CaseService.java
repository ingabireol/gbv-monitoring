package com.gbvmonitor.service;

import com.gbvmonitor.dto.CaseResponse;
import com.gbvmonitor.dto.VictimCaseUpdateRequest;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;

public interface CaseService {
    Page<CaseResponse> getAllCases(String status, String type, Pageable pageable, UserDetails userDetails);
    List<CaseResponse> getCasesForVictim(String username);
    List<CaseResponse> getCasesForOfficer(String username);
    CaseResponse assignOfficer(UUID caseId, UUID officerId, UserDetails userDetails);
    CaseResponse updateStatus(UUID caseId, String status, UserDetails userDetails);
    CaseResponse updateVictimOpenCase(UUID caseId, VictimCaseUpdateRequest request, UserDetails userDetails);
    CaseResponse withdrawVictimOpenCase(UUID caseId, UserDetails userDetails);
    void deleteCase(UUID caseId, UserDetails userDetails);
}
