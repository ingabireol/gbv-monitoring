package com.gbvmonitor.dto;

import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private String displayName;
    private String email;
    private String password;
    private String role;
    private String district;
    private String institution;
}
