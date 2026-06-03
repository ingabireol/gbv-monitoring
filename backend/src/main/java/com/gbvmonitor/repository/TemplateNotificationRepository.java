package com.gbvmonitor.repository;

import com.gbvmonitor.entity.TemplateNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TemplateNotificationRepository extends JpaRepository<TemplateNotification, UUID> {
    Optional<TemplateNotification> findByName(String name);
}
