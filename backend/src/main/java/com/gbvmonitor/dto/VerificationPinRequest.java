package com.gbvmonitor.dto;

import lombok.Data;

@Data
public class VerificationPinRequest {
    private String email;
    private String pin;
}
