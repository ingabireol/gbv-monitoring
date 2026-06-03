package com.gbvmonitor.repository;

import com.gbvmonitor.entity.AnonymousChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnonymousChatMessageRepository extends JpaRepository<AnonymousChatMessage, UUID> {
    List<AnonymousChatMessage> findByReport_IdOrderByCreatedAtAsc(UUID reportId);
    void deleteByReport_ACase_Id(UUID caseId);
}
