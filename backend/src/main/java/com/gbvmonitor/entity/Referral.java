package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "referrals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Referral {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case aCase;

    @Column(nullable = false)
    private String referredTo;

    @Column
    private String referredBy;

    @Column
    private String referredByRole;

    @Column
    private String institutionType;

    @Column(length = 2000)
    private String reason;

    @Column
    private String urgency;

    @Column(nullable = false)
    private String status;

    @Column
    private Date dateAcknowledged;

    @Column(nullable = false)
    private Date createdAt;

    @Column
    private Date updatedAt;
}
