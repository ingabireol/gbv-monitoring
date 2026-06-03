package com.gbvmonitor.repository;

import com.gbvmonitor.entity.EvidenceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface EvidenceFileRepository extends JpaRepository<EvidenceFile, UUID> {
    @Modifying
    @Query("delete from EvidenceFile evidenceFile where evidenceFile.aCase.id = :caseId")
    void deleteByCaseId(@Param("caseId") UUID caseId);
}
