package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "evidence_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceFile {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case aCase;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private String fileUrl;

    @Column(nullable = false)
    private Date uploadedAt;
}
