package com.gbvmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AnonymousChatMessageResponse {
    private UUID id;
    private String sender;
    private String senderDisplayName;
    private String message;
    private Date createdAt;
}
