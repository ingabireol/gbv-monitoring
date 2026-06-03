package com.gbvmonitor.repository;

import com.gbvmonitor.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {
    @Modifying
    @Query("delete from Referral referral where referral.aCase.id = :caseId")
    void deleteByCaseId(@Param("caseId") UUID caseId);
}
