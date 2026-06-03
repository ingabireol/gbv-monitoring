package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Case {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String caseId;

    @Column(nullable = false)
    private String type; // GBV, CA, ANON

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "victim_id")
    private Victim victim;

    @ManyToOne
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;

    @Column(nullable = false)
    private Date createdAt;

    @Column
    private Date updatedAt;
}
