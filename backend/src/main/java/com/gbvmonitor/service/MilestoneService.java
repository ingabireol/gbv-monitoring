package com.gbvmonitor.service;

import com.gbvmonitor.dto.MilestoneRequest;
import com.gbvmonitor.dto.MilestoneResponse;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;
import java.util.UUID;

public interface MilestoneService {
    List<MilestoneResponse> getMilestonesByCase(UUID caseId, UserDetails userDetails);
    MilestoneResponse addMilestone(MilestoneRequest request, UserDetails userDetails);
    MilestoneResponse updateMilestone(UUID milestoneId, MilestoneRequest request, UserDetails userDetails);
    MilestoneResponse completeMilestone(UUID milestoneId, UserDetails userDetails);
    void deleteMilestone(UUID milestoneId, UserDetails userDetails);
}
