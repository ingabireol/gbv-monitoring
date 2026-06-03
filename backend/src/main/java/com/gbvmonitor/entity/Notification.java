package com.gbvmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private Date createdAt;
}
