package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "timeline_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineEvent {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case aCase;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Date eventAt;
}
