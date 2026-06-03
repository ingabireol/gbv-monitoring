package com.gbvmonitor.repository;

import com.gbvmonitor.entity.TimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface TimelineEventRepository extends JpaRepository<TimelineEvent, UUID> {
    @Modifying
    @Query("delete from TimelineEvent timelineEvent where timelineEvent.aCase.id = :caseId")
    void deleteByCaseId(@Param("caseId") UUID caseId);
}
