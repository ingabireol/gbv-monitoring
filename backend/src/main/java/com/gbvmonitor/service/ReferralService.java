package com.gbvmonitor.service;

import com.gbvmonitor.dto.ReferralRequest;
import com.gbvmonitor.dto.ReferralResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.UUID;

public interface ReferralService {
    ReferralResponse createReferral(ReferralRequest request, UserDetails userDetails);
    ReferralResponse updateReferral(UUID referralId, ReferralRequest request, UserDetails userDetails);
    ReferralResponse updateReferralStatus(UUID referralId, String status, UserDetails userDetails);
    Page<ReferralResponse> getReferralsByCase(UUID caseId, Pageable pageable, UserDetails userDetails);
    Page<ReferralResponse> getReferrals(String referredTo, String status, Pageable pageable, UserDetails userDetails);
}
