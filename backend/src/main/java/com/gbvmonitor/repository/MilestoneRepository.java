package com.gbvmonitor.repository;

import com.gbvmonitor.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {
    @Modifying
    @Query("delete from Milestone milestone where milestone.aCase.id = :caseId")
    void deleteByCaseId(@Param("caseId") UUID caseId);
}
