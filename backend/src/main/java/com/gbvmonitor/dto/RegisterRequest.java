package com.gbvmonitor.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String role;
    private String displayName;
    private String district;
    private String institution;
    private String ageGroup;
}
