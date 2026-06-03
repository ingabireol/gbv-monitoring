package com.gbvmonitor.repository;

import com.gbvmonitor.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    Optional<Report> findByReference(String reference);
    Optional<Report> findByReferenceIgnoreCase(String reference);
    Optional<Report> findByACase_CaseIdIgnoreCase(String caseId);
    @Query("""
            select report from Report report
            where report.aCase is not null
            and report.aCase.id = :caseId
            order by report.reportedAt desc
            """)
    List<Report> findByCaseIdOrderByReportedAtDesc(@Param("caseId") UUID caseId);
    Optional<Report> findBySubmissionKey(String submissionKey);

    @Query("""
            select report from Report report
            left join report.aCase aCase
            where lower(report.reportType) = lower(:reportType)
            and (
                lower(report.reference) = lower(:lookup)
                or lower(aCase.caseId) = lower(:lookup)
            )
            """)
    Optional<Report> findAnonymousByReferenceOrCaseId(
            @Param("lookup") String lookup,
            @Param("reportType") String reportType
    );

    @Modifying
    @Query("delete from Report report where report.aCase.id = :caseId")
    void deleteByCaseId(@Param("caseId") UUID caseId);
}
