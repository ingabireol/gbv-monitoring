package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private String token;
    private String userId;
    private String username;
    private String displayName;
    private String email;
    private String role;
    private String district;
    private String institution;
    private String verificationPin;
}
