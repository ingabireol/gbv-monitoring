package com.gbvmonitor.repository;

import com.gbvmonitor.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CaseRepository extends JpaRepository<Case, UUID> {
    Optional<Case> findByCaseId(String caseId);
    List<Case> findByVictim_Account_IdOrderByCreatedAtDesc(UUID accountId);
    List<Case> findByAssignedOfficer_Id(UUID officerId);
}
