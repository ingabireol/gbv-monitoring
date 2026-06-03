package com.gbvmonitor.config;

import com.gbvmonitor.entity.Role;
import com.gbvmonitor.entity.TemplateNotification;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.RoleRepository;
import com.gbvmonitor.repository.TemplateNotificationRepository;
import com.gbvmonitor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final TemplateNotificationRepository templateNotificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            String[] roles = {"ADMIN", "DISTRICT_ADMIN", "POLICE", "SOCIAL_WORKER", "PARTNER", "VICTIM", "PUBLIC"};
            for (String r : roles) {
                roleRepository.findByName(r).orElseGet(() -> roleRepository.save(Role.builder().name(r).build()));
            }

            seedUser("admin@migeprof.gov.rw", "admin@migeprof.gov.rw", "MIGEPROF Administrator", "Admin@2024", "ADMIN", null, null);
            seedUser("uwimana@rnp.gov.rw", "uwimana@rnp.gov.rw", "Sgt. Uwimana", "Police@2024", "POLICE", "Gasabo", null);
            seedUser("habimana@rnp.gov.rw", "habimana@rnp.gov.rw", "Insp. Habimana", "Police@2024", "POLICE", "Kicukiro", null);
            seedUser("mukiza@rnp.gov.rw", "mukiza@rnp.gov.rw", "Insp. Mukiza", "Police@2024", "POLICE", "Musanze", null);
            seedUser("uwase@migeprof.gov.rw", "uwase@migeprof.gov.rw", "Amina Uwase", "Social@2024", "SOCIAL_WORKER", "Gasabo", null);
            seedUser("ingabire@migeprof.gov.rw", "ingabire@migeprof.gov.rw", "Grace Ingabire", "Social@2024", "SOCIAL_WORKER", "Nyarugenge", null);
            seedUser("ndayisaba@gasabo.gov.rw", "ndayisaba@gasabo.gov.rw", "Emmanuel Ndayisaba", "District@2024", "DISTRICT_ADMIN", "Gasabo", null);
            seedUser("bizimana@huye.gov.rw", "bizimana@huye.gov.rw", "Jean Bizimana", "District@2024", "DISTRICT_ADMIN", "Huye", null);
            seedUser("claire@isange.gov.rw", "claire@isange.gov.rw", "Dr. Claire Mukamana", "Partner@2024", "PARTNER", null, "Isange One Stop Centre");
            seedUser("legal@rwandalegalaid.org", "legal@rwandalegalaid.org", "Rwanda Legal Aid Desk", "Partner@2024", "PARTNER", null, "Rwanda Legal Aid Forum");
            seedUser("mental@rmhp.org.rw", "mental@rmhp.org.rw", "Mental Health Focal Point", "Partner@2024", "PARTNER", null, "Rwanda Mental Health Programme");
            seedUser("child@ncda.gov.rw", "child@ncda.gov.rw", "NCDA Child Protection Officer", "Partner@2024", "PARTNER", null, "National Child Development Agency");
            seedUser("victim.demo", "victim.demo@gbvmonitor.local", "Victim Demo", "Victim@2024", "VICTIM", "Gasabo", null);

            seedTemplate(
                    "Case Registration Confirmation",
                    "When a new case is registered",
                    "Your case has been registered - GBV Monitor",
                    "Dear {{victim_name}},\n\nYour case {{case_id}} has been registered successfully.\n\nGBV Monitor - MIGEPROF Rwanda",
                    "en",
                    "both"
            );
            seedTemplate(
                    "Officer Assignment Notification",
                    "When an officer is assigned to a case",
                    "An officer has been assigned to your case",
                    "Dear {{victim_name}},\n\n{{officer_name}} has been assigned to your case {{case_id}}.\n\nGBV Monitor - MIGEPROF Rwanda",
                    "en",
                    "both"
            );
            seedTemplate(
                    "Case Status Update",
                    "When case status changes",
                    "Update on your case {{case_id}}",
                    "Dear {{victim_name}},\n\nThere is an update on your case {{case_id}}.\nCurrent status: {{case_status}}",
                    "en",
                    "both"
            );
        };
    }

    private void seedUser(
            String username,
            String email,
            String displayName,
            String password,
            String roleName,
            String district,
            String institution
    ) {
        var existingUser = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(username, email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (user.getDisplayName() == null || user.getDisplayName().isBlank()) {
                user.setDisplayName(displayName);
            }
            if (user.getDistrict() == null || user.getDistrict().isBlank()) {
                user.setDistrict(district);
            }
            if (user.getInstitution() == null || user.getInstitution().isBlank()) {
                user.setInstitution(institution);
            }
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(new Date());
            }
            userRepository.save(user);
            return;
        }

        Role role = roleRepository.findByName(roleName).orElseThrow();
        User user = User.builder()
                .username(username)
                .displayName(displayName)
                .password(passwordEncoder.encode(password))
                .email(email)
                .district(district)
                .institution(institution)
                .enabled(true)
                .roles(Set.of(role))
                .createdAt(new Date())
                .build();
        userRepository.save(user);
    }

    private void seedTemplate(
            String name,
            String triggerEvent,
            String subject,
            String template,
            String language,
            String channel
    ) {
        var existingTemplate = templateNotificationRepository.findByName(name);
        if (existingTemplate.isPresent()) {
            TemplateNotification templateNotification = existingTemplate.get();
            if (templateNotification.getTriggerEvent() == null) {
                templateNotification.setTriggerEvent(triggerEvent);
            }
            if (templateNotification.getSubject() == null) {
                templateNotification.setSubject(subject);
            }
            if (templateNotification.getLanguage() == null) {
                templateNotification.setLanguage(language);
            }
            if (templateNotification.getChannel() == null) {
                templateNotification.setChannel(channel);
            }
            if (templateNotification.getSentCount() == null) {
                templateNotification.setSentCount(0L);
            }
            if (templateNotification.getCreatedAt() == null) {
                templateNotification.setCreatedAt(new Date());
            }
            templateNotification.setUpdatedAt(new Date());
            templateNotificationRepository.save(templateNotification);
            return;
        }

        templateNotificationRepository.save(
                TemplateNotification.builder()
                        .name(name)
                        .triggerEvent(triggerEvent)
                        .subject(subject)
                        .template(template)
                        .language(language)
                        .channel(channel)
                        .active(true)
                        .sentCount(0L)
                        .createdAt(new Date())
                        .updatedAt(new Date())
                        .build()
        );
    }
}
