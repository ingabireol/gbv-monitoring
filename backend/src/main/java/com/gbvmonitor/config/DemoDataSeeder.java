package com.gbvmonitor.config;

import com.gbvmonitor.entity.*;
import com.gbvmonitor.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/**
 * Loads realistic demo cases, reports, referrals, milestones, notifications,
 * audit logs, and anonymous chat messages for development and demonstration.
 *
 * Enable by setting  gbvmonitor.seed.demo-data=true  in application.properties
 * (or backend/.env). The seeder is idempotent — it skips if demo data already exists.
 * DataSeeder (Order 1) must run first to create the base users.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder {

    private final CaseRepository                caseRepository;
    private final VictimRepository              victimRepository;
    private final UserRepository                userRepository;
    private final ReportRepository              reportRepository;
    private final MilestoneRepository           milestoneRepository;
    private final TimelineEventRepository       timelineEventRepository;
    private final ReferralRepository            referralRepository;
    private final NotificationRepository        notificationRepository;
    private final AuditLogRepository            auditLogRepository;
    private final AnonymousChatMessageRepository anonymousChatMessageRepository;

    @Bean
    @Order(2)
    @ConditionalOnProperty(name = "gbvmonitor.seed.demo-data", havingValue = "true")
    public CommandLineRunner seedDemoData() {
        return args -> {
            if (caseRepository.findByCaseId("DEMO-GBV-2024-0001").isPresent()) {
                log.info("Demo data already present — skipping.");
                return;
            }
            log.info("Seeding demo dataset: cases, reports, milestones, referrals, chat messages...");

            User admin    = requireUser("admin@migeprof.gov.rw");
            User uwimana  = findUser("uwimana@rnp.gov.rw").orElse(null);
            User habimana = findUser("habimana@rnp.gov.rw").orElse(null);
            User mukiza   = findUser("mukiza@rnp.gov.rw").orElse(null);
            User uwase    = findUser("uwase@migeprof.gov.rw").orElse(null);
            User ingabire = findUser("ingabire@migeprof.gov.rw").orElse(null);
            User demoVict = requireUser("victim.demo");

            // ── 1. RESOLVED GBV — domestic violence, Gasabo (linked to victim.demo account) ──
            Victim v1 = victimRepository.findByAccountId(demoVict.getId())
                    .orElseGet(() -> victimRepository.save(Victim.builder()
                            .name("Victim Demo").gender("Female").age(28)
                            .address("Gasabo").account(demoVict).build()));
            Case c1 = mkCase("DEMO-GBV-2024-0001", "GBV", "RESOLVED", v1, uwimana, daysAgo(90));
            mkReport(c1, "Authenticated",
                    "Incident Type: Domestic Violence\nDistrict: Gasabo\nDate: 2024-03-02\n" +
                    "Narrative: Victim reported repeated physical abuse at home over several months. " +
                    "Legal intervention completed and case resolved.",
                    null, null, daysAgo(90));
            mkMilestones(c1, "RESOLVED", daysAgo(90));
            mkTimeline(c1, uwimana, "RESOLVED", daysAgo(90));
            mkReferral(c1, "Isange One Stop Centre",       "Amina Uwase",   "SOCIAL_WORKER",
                    "Medical examination and psychosocial support.",          "HIGH",   "COMPLETED", daysAgo(85));
            mkReferral(c1, "Rwanda Legal Aid Forum",        "Sgt. Uwimana",  "POLICE",
                    "Legal representation and court filing support.",          "MEDIUM", "COMPLETED", daysAgo(60));
            mkNotif(demoVict, "CASE_REGISTERED",
                    "Your case DEMO-GBV-2024-0001 has been registered successfully.", daysAgo(90));
            mkNotif(demoVict, "CASE_STATUS_UPDATED",
                    "Your case DEMO-GBV-2024-0001 has been resolved. Support services remain available.", daysAgo(30));
            mkAudit(admin, "[DEMO] Case DEMO-GBV-2024-0001 created and assigned to Sgt. Uwimana.", daysAgo(90));
            mkAudit(admin, "[DEMO] Case DEMO-GBV-2024-0001 marked RESOLVED after successful intervention.", daysAgo(30));

            // ── 2. IN_PROGRESS GBV — sexual assault, Gasabo (Uwimana) ──
            Victim v2 = mkVictim("Victim #00142", "Female", 24, "Gasabo");
            Case c2 = mkCase("DEMO-GBV-2024-0002", "GBV", "IN_PROGRESS", v2, uwimana, daysAgo(60));
            mkReport(c2, "Authenticated",
                    "Incident Type: Sexual Assault\nDistrict: Gasabo\nDate: 2024-05-01\n" +
                    "Witness Name: John Mutesi\nWitness Contact: +250 788 000 111\n" +
                    "Narrative: Victim reported assault by an acquaintance. Witness confirmed. Active support ongoing.",
                    "John Mutesi", "+250 788 000 111", daysAgo(60));
            mkMilestones(c2, "SUPPORT", daysAgo(60));
            mkTimeline(c2, uwimana, "SUPPORT", daysAgo(60));
            mkReferral(c2, "Rwanda Mental Health Programme", "Amina Uwase",  "SOCIAL_WORKER",
                    "Trauma counselling — at least 8 sessions recommended.", "HIGH",   "ACCEPTED", daysAgo(55));
            mkNotif(demoVict, "CASE_STATUS_UPDATED",
                    "A support referral was created for case DEMO-GBV-2024-0002.", daysAgo(55));
            mkAudit(uwase, "[DEMO] Referral created DEMO-GBV-2024-0002 → Rwanda Mental Health Programme.", daysAgo(55));

            // ── 3. INVESTIGATION GBV — physical abuse, Kicukiro (Habimana) ──
            Victim v3 = mkVictim("Victim #00201", "Male", 35, "Kicukiro");
            Case c3 = mkCase("DEMO-GBV-2024-0003", "GBV", "INVESTIGATION", v3, habimana, daysAgo(45));
            mkReport(c3, "Authenticated",
                    "Incident Type: Physical Abuse\nDistrict: Kicukiro\nDate: 2024-05-16\n" +
                    "Narrative: Victim reported ongoing physical abuse by a household member. Under active investigation.",
                    null, null, daysAgo(45));
            mkMilestones(c3, "INVESTIGATION", daysAgo(45));
            mkTimeline(c3, habimana, "INVESTIGATION", daysAgo(45));
            mkAudit(habimana, "[DEMO] Investigation opened for DEMO-GBV-2024-0003.", daysAgo(40));

            // ── 4. ASSIGNED GBV — economic abuse, Musanze (Mukiza) ──
            Victim v4 = mkVictim("Victim #00289", "Female", 41, "Musanze");
            Case c4 = mkCase("DEMO-GBV-2024-0004", "GBV", "ASSIGNED", v4, mukiza, daysAgo(20));
            mkReport(c4, "Authenticated",
                    "Incident Type: Economic Abuse\nDistrict: Musanze\nDate: 2024-06-11\n" +
                    "Narrative: Victim reports denial of access to household finances and resources by their partner.",
                    null, null, daysAgo(20));
            mkMilestones(c4, "ASSIGNED", daysAgo(20));
            mkTimeline(c4, mukiza, "ASSIGNED", daysAgo(20));
            mkAudit(admin, "[DEMO] Insp. Mukiza assigned to DEMO-GBV-2024-0004.", daysAgo(19));

            // ── 5. FILED GBV — stalking, Huye (unassigned, overdue) ──
            Victim v5 = mkVictim("Victim #00312", "Female", 29, "Huye");
            Case c5 = mkCase("DEMO-GBV-2024-0005", "GBV", "FILED", v5, null, daysAgo(18));
            mkReport(c5, "Authenticated",
                    "Incident Type: Stalking/Harassment\nDistrict: Huye\nDate: 2024-06-13\n" +
                    "Narrative: Victim is being followed and harassed by a former partner. Requires urgent assignment.",
                    null, null, daysAgo(18));
            mkMilestones(c5, "FILED", daysAgo(18));
            mkTimeline(c5, null, "FILED", daysAgo(18));

            // ── 6. FILED GBV — emotional abuse, Rubavu (unassigned) ──
            Victim v6 = mkVictim("Victim #00334", "Female", 33, "Rubavu");
            Case c6 = mkCase("DEMO-GBV-2024-0006", "GBV", "FILED", v6, null, daysAgo(3));
            mkReport(c6, "Authenticated",
                    "Incident Type: Emotional Abuse\nDistrict: Rubavu\nDate: 2024-06-28\n" +
                    "Narrative: Victim subject to ongoing verbal and psychological abuse by spouse.",
                    null, null, daysAgo(3));
            mkMilestones(c6, "FILED", daysAgo(3));
            mkTimeline(c6, null, "FILED", daysAgo(3));

            // ── 7. FILED GBV — early marriage, Ngoma (social worker report) ──
            Victim v7 = mkVictim("Child #00178", "Female", 16, "Ngoma");
            Case c7 = mkCase("DEMO-GBV-2024-0007", "GBV", "FILED", v7, null, daysAgo(1));
            mkReport(c7, "SocialWorker",
                    "Incident Type: Early Marriage\nDistrict: Ngoma\nDate: 2024-06-30\n" +
                    "Narrative: 16-year-old pressured into an arranged marriage. Urgent intervention required.",
                    null, null, daysAgo(1));
            mkMilestones(c7, "FILED", daysAgo(1));
            mkTimeline(c7, null, "FILED", daysAgo(1));

            // ── 8. WITHDRAWN GBV — domestic violence, Rwamagana ──
            Victim v8 = mkVictim("Victim #00198", "Female", 38, "Rwamagana");
            Case c8 = mkCase("DEMO-GBV-2024-0008", "GBV", "WITHDRAWN", v8, null, daysAgo(70));
            mkReport(c8, "Authenticated",
                    "Incident Type: Domestic Violence\nDistrict: Rwamagana\nDate: 2024-04-21\n" +
                    "Narrative: Case was filed by the victim but later withdrawn at the victim's explicit request.",
                    null, null, daysAgo(70));
            milestoneRepository.save(Milestone.builder().aCase(c8).name("Filed").completed(true).completedAt(daysAgo(70)).build());
            milestoneRepository.save(Milestone.builder().aCase(c8).name("Assigned").completed(false).build());
            milestoneRepository.save(Milestone.builder().aCase(c8).name("Investigation").completed(false).build());
            milestoneRepository.save(Milestone.builder().aCase(c8).name("Support").completed(false).build());
            milestoneRepository.save(Milestone.builder().aCase(c8).name("Resolved").completed(false).build());
            timelineEventRepository.save(TimelineEvent.builder().aCase(c8).eventType("CASE_FILED")
                    .description("Case DEMO-GBV-2024-0008 filed for Domestic Violence in Rwamagana.")
                    .eventAt(daysAgo(70)).build());
            timelineEventRepository.save(TimelineEvent.builder().aCase(c8).eventType("CASE_WITHDRAWN")
                    .description("Victim requested withdrawal of case DEMO-GBV-2024-0008.")
                    .eventAt(daysAgo(65)).build());

            // ── 9. RESOLVED CA — child neglect, Gasabo (Habimana) ──
            Victim v9 = mkVictim("Child #00089", "Female", 12, "Gasabo");
            Case c9 = mkCase("DEMO-CA-2024-0001", "CA", "RESOLVED", v9, habimana, daysAgo(120));
            mkReport(c9, "SocialWorker",
                    "Incident Type: Child Neglect\nDistrict: Gasabo\nDate: 2024-02-20\n" +
                    "Narrative: Child found without adequate food or shelter. Family intervention completed.",
                    null, null, daysAgo(120));
            mkMilestones(c9, "RESOLVED", daysAgo(120));
            mkTimeline(c9, habimana, "RESOLVED", daysAgo(120));
            mkReferral(c9, "National Child Development Agency", "Grace Ingabire", "SOCIAL_WORKER",
                    "Child protection assessment and family reunification programme.", "HIGH", "COMPLETED", daysAgo(110));
            mkAudit(admin, "[DEMO] Child case DEMO-CA-2024-0001 resolved after family intervention.", daysAgo(80));

            // ── 10. FILED CA — child labour, Nyarugenge (unassigned) ──
            Victim v10 = mkVictim("Child #00102", "Male", 9, "Nyarugenge");
            Case c10 = mkCase("DEMO-CA-2024-0002", "CA", "FILED", v10, null, daysAgo(6));
            mkReport(c10, "SocialWorker",
                    "Incident Type: Child Labor\nDistrict: Nyarugenge\nDate: 2024-06-25\n" +
                    "Narrative: 9-year-old found working in a market stall without school enrolment.",
                    null, null, daysAgo(6));
            mkMilestones(c10, "FILED", daysAgo(6));
            mkTimeline(c10, null, "FILED", daysAgo(6));
            mkReferral(c10, "National Child Development Agency", "Grace Ingabire", "SOCIAL_WORKER",
                    "Child welfare assessment and school re-enrolment support.", "HIGH", "PENDING", daysAgo(5));

            // ── 11. FILED ANON — anonymous domestic violence, Muhanga (with demo chat) ──
            Victim v11 = mkVictim("Anonymous Reporter", null, null, "Muhanga");
            Case c11 = mkCase("DEMO-ANON-2024-0001", "ANON", "FILED", v11, uwimana, daysAgo(2));
            Report r11 = mkReport(c11, "Anonymous",
                    "Incident Type: Domestic Violence\nDistrict: Muhanga\nDate: 2024-06-29\n" +
                    "Narrative: Anonymous tip regarding suspected domestic violence at a residential address in Muhanga sector.",
                    null, null, daysAgo(2));
            mkMilestones(c11, "FILED", daysAgo(2));
            mkTimeline(c11, uwimana, "ASSIGNED", daysAgo(2));
            // Demo conversation between anonymous reporter and assigned officer
            if (r11 != null && uwimana != null) {
                mkChat(r11, "REPORTER", "Anonymous Reporter",
                        "I want to report what is happening to my neighbour. She is being hurt by her husband every night. I am scared to give my name.",
                        daysAgo(2));
                mkChat(r11, "OFFICER", uwimana.getDisplayName(),
                        "Thank you for reaching out. Your identity is fully protected. Can you tell me which sector or cell in Muhanga the incident is happening?",
                        daysAgo(2));
                mkChat(r11, "REPORTER", "Anonymous Reporter",
                        "It is in Mushishiro sector, near the secondary school. I hear the violence almost every evening.",
                        hoursAgo(36));
                mkChat(r11, "OFFICER", uwimana.getDisplayName(),
                        "This is very helpful. We will send officers to the area discreetly. Do you know approximately what time the incidents usually occur?",
                        hoursAgo(30));
                mkChat(r11, "REPORTER", "Anonymous Reporter",
                        "Usually between 8pm and 10pm. Please do not tell her I reported this.",
                        hoursAgo(24));
                mkChat(r11, "OFFICER", uwimana.getDisplayName(),
                        "Your report will remain completely anonymous. We will act on this information. Thank you for your courage in reporting this.",
                        hoursAgo(20));
            }
            mkAudit(admin, "[DEMO] Anonymous case DEMO-ANON-2024-0001 filed and assigned to Sgt. Uwimana.", daysAgo(2));

            // ── 12. INVESTIGATION GBV — stalking, Nyarugenge (Uwimana) ──
            Victim v12 = mkVictim("Victim #00356", "Female", 26, "Nyarugenge");
            Case c12 = mkCase("DEMO-GBV-2024-0009", "GBV", "INVESTIGATION", v12, uwimana, daysAgo(30));
            mkReport(c12, "SocialWorker",
                    "Incident Type: Stalking/Harassment\nDistrict: Nyarugenge\nDate: 2024-06-01\n" +
                    "Narrative: Victim followed by a former colleague. Online harassment also reported.",
                    null, null, daysAgo(30));
            mkMilestones(c12, "INVESTIGATION", daysAgo(30));
            mkTimeline(c12, uwimana, "INVESTIGATION", daysAgo(30));
            mkAudit(ingabire, "[DEMO] Social worker Ingabire opened support file for DEMO-GBV-2024-0009.", daysAgo(25));

            // ── 13. FILED GBV — sexual assault, Karongi (partner referral pending) ──
            Victim v13 = mkVictim("Victim #00412", "Female", 22, "Karongi");
            Case c13 = mkCase("DEMO-GBV-2024-0010", "GBV", "FILED", v13, null, daysAgo(5));
            mkReport(c13, "Authenticated",
                    "Incident Type: Sexual Assault\nDistrict: Karongi\nDate: 2024-06-26\n" +
                    "Narrative: Victim reported an assault by an unknown individual while returning home in the evening.",
                    null, null, daysAgo(5));
            mkMilestones(c13, "FILED", daysAgo(5));
            mkTimeline(c13, null, "FILED", daysAgo(5));
            mkReferral(c13, "Isange One Stop Centre", "Amina Uwase", "SOCIAL_WORKER",
                    "Urgent medical and psychosocial intake required.", "CRITICAL", "PENDING", daysAgo(4));

            // ── Audit log for the seeding operation itself ──
            mkAudit(admin, "[DEMO] Demo dataset loaded — 13 sample cases across 9 districts.", new Date());
            log.info("Demo data seeded — 13 cases, referrals, milestones, notifications, and chat messages created.");
        };
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private User requireUser(String usernameOrEmail) {
        return findUser(usernameOrEmail).orElseThrow(() ->
                new IllegalStateException("Demo seeder: required user not found: " + usernameOrEmail +
                        ". Run the app once without demo-data=true so DataSeeder creates base users first."));
    }

    private Optional<User> findUser(String usernameOrEmail) {
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(usernameOrEmail, usernameOrEmail);
    }

    private Victim mkVictim(String name, String gender, Integer age, String address) {
        return victimRepository.save(
                Victim.builder().name(name).gender(gender).age(age).address(address).build());
    }

    private Case mkCase(String caseId, String type, String status,
                        Victim victim, User officer, Date createdAt) {
        return caseRepository.findByCaseId(caseId).orElseGet(() ->
                caseRepository.save(Case.builder()
                        .caseId(caseId).type(type).status(status)
                        .victim(victim).assignedOfficer(officer)
                        .createdAt(createdAt)
                        .updatedAt("FILED".equals(status) || "WITHDRAWN".equals(status)
                                ? null : after(createdAt, 2))
                        .build()));
    }

    private Report mkReport(Case aCase, String reportType, String description,
                            String witnessName, String witnessContact, Date reportedAt) {
        String ref = "REF-" + aCase.getCaseId().replace("DEMO-", "");
        return reportRepository.findByReference(ref).orElseGet(() ->
                reportRepository.save(Report.builder()
                        .reference(ref).aCase(aCase).reportType(reportType)
                        .description(description)
                        .witnessName(witnessName).witnessContact(witnessContact)
                        .reportedAt(reportedAt).build()));
    }

    private void mkMilestones(Case aCase, String status, Date base) {
        String[] names    = { "Filed", "Assigned", "Investigation", "Support", "Resolved" };
        String[] statuses = { "FILED", "ASSIGNED", "INVESTIGATION", "SUPPORT", "RESOLVED" };
        int upTo = 0;
        for (int i = 0; i < statuses.length; i++) {
            if (statuses[i].equalsIgnoreCase(status)) upTo = i;
        }
        if ("RESOLVED".equalsIgnoreCase(status)) upTo = 4;
        for (int i = 0; i < names.length; i++) {
            boolean done = i <= upTo;
            milestoneRepository.save(Milestone.builder()
                    .aCase(aCase).name(names[i])
                    .completed(done).completedAt(done ? after(base, i * 7) : null)
                    .build());
        }
    }

    private void mkTimeline(Case aCase, User officer, String status, Date base) {
        String district = aCase.getVictim() != null ? aCase.getVictim().getAddress() : "the district";
        timelineEventRepository.save(TimelineEvent.builder().aCase(aCase)
                .eventType("CASE_FILED")
                .description("Case " + aCase.getCaseId() + " registered for " + aCase.getType() + " in " + district + ".")
                .eventAt(base).build());

        boolean assigned = officer != null && !"FILED".equals(status) && !"WITHDRAWN".equals(status);
        if (assigned) {
            timelineEventRepository.save(TimelineEvent.builder().aCase(aCase)
                    .eventType("OFFICER_ASSIGNED")
                    .description(officer.getDisplayName() + " assigned to case " + aCase.getCaseId() + ".")
                    .eventAt(after(base, 2)).build());
        }
        if ("INVESTIGATION".equals(status) || "SUPPORT".equals(status) || "RESOLVED".equals(status)) {
            timelineEventRepository.save(TimelineEvent.builder().aCase(aCase)
                    .eventType("CASE_STATUS_UPDATED")
                    .description("Case " + aCase.getCaseId() + " progressed to Investigation.")
                    .eventAt(after(base, 7)).build());
        }
        if ("SUPPORT".equals(status) || "RESOLVED".equals(status)) {
            timelineEventRepository.save(TimelineEvent.builder().aCase(aCase)
                    .eventType("CASE_STATUS_UPDATED")
                    .description("Support services initiated for case " + aCase.getCaseId() + ". Inter-agency referral created.")
                    .eventAt(after(base, 14)).build());
        }
        if ("RESOLVED".equals(status)) {
            timelineEventRepository.save(TimelineEvent.builder().aCase(aCase)
                    .eventType("CASE_STATUS_UPDATED")
                    .description("Case " + aCase.getCaseId() + " marked resolved after successful intervention.")
                    .eventAt(after(base, 28)).build());
        }
    }

    private void mkReferral(Case aCase, String referredTo, String referredBy,
                            String referredByRole, String reason, String urgency,
                            String status, Date createdAt) {
        referralRepository.save(Referral.builder()
                .aCase(aCase)
                .referredTo(referredTo).referredBy(referredBy).referredByRole(referredByRole)
                .institutionType(resolveType(referredTo))
                .reason(reason).urgency(urgency).status(status)
                .dateAcknowledged("PENDING".equals(status) ? null : after(createdAt, 3))
                .createdAt(createdAt).updatedAt(after(createdAt, 3))
                .build());
    }

    private void mkNotif(User user, String type, String message, Date createdAt) {
        notificationRepository.save(Notification.builder()
                .user(user).type(type).message(message).read(false).createdAt(createdAt).build());
    }

    private void mkAudit(User user, String action, Date timestamp) {
        auditLogRepository.save(AuditLog.builder().user(user).action(action).timestamp(timestamp).build());
    }

    private void mkChat(Report report, String sender, String senderDisplayName,
                        String message, Date createdAt) {
        anonymousChatMessageRepository.save(AnonymousChatMessage.builder()
                .report(report).sender(sender).senderDisplayName(senderDisplayName)
                .message(message).createdAt(createdAt).build());
    }

    private String resolveType(String institution) {
        if (institution == null) return "Other";
        String l = institution.toLowerCase();
        if (l.contains("health") || l.contains("medical") || l.contains("isange")) return "Medical";
        if (l.contains("legal") || l.contains("law"))                               return "Legal";
        if (l.contains("mental") || l.contains("psycho"))                           return "Psychosocial";
        if (l.contains("child") || l.contains("ncda"))                              return "ChildProtection";
        return "Support";
    }

    private Date daysAgo(int days) {
        return Date.from(Instant.now().minus(days, ChronoUnit.DAYS));
    }

    private Date hoursAgo(int hours) {
        return Date.from(Instant.now().minus(hours, ChronoUnit.HOURS));
    }

    private Date after(Date base, int days) {
        return Date.from(base.toInstant().plus(days, ChronoUnit.DAYS));
    }
}
