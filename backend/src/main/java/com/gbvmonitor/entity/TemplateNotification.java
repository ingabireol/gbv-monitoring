package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "template_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateNotification {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "trigger_event")
    private String triggerEvent;

    @Column
    private String subject;

    @Column(nullable = false)
    private String template;

    @Column
    private String language = "en";

    @Column
    private String channel = "both";

    @Column
    private boolean active = true;

    @Column
    private Date lastSent;

    @Column
    private Long sentCount = 0L;

    @Column(updatable = false)
    private Date createdAt = new Date();

    @Column
    private Date updatedAt = new Date();
}
