package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String username;
    private String displayName;
    private String email;
    private String role;
    private boolean enabled;
    private String district;
    private String institution;
    private Date createdAt;
    private Date lastLoginAt;
}
