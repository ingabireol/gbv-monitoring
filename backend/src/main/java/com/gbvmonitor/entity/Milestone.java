package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "milestones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Milestone {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case aCase;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean completed = false;

    @Column
    private Date completedAt;
}
