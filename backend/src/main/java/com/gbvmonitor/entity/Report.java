package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String reference;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case aCase;

    @Column(nullable = false)
    private String reportType; // Authenticated, SocialWorker, Anonymous

    @Column(nullable = false)
    private Date reportedAt;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private Date incidentAt;

    @Column
    private String incidentLocation;

    @Column
    private String reporterName;

    @Column
    private String reporterContact;

    @Column
    private String witnessName;

    @Column
    private String witnessContact;

    @Column(length = 1000)
    private String witnessLocation;

    @Column(length = 2000)
    private String witnessStatement;

    @Column(unique = true)
    private String submissionKey;
}
