package com.gbvmonitor.service;

import com.gbvmonitor.dto.RegisterRequest;
import com.gbvmonitor.dto.VerificationPinRequest;

public interface VictimEmailVerificationService {
    String requestVerificationPin(RegisterRequest request);
    RegisterRequest verifyPin(VerificationPinRequest request);
}
