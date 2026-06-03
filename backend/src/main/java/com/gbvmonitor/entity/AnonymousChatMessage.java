package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "anonymous_chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnonymousChatMessage {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Column(nullable = false)
    private String sender; // REPORTER or OFFICER

    @Column
    private String senderDisplayName;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private Date createdAt;
}
