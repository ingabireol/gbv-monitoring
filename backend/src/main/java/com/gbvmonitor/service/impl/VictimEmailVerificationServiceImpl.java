package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.RegisterRequest;
import com.gbvmonitor.dto.VerificationPinRequest;
import com.gbvmonitor.service.VictimEmailVerificationService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VictimEmailVerificationServiceImpl implements VictimEmailVerificationService {
    private final Map<String, PendingVictimRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Duration pinExpiration;
    private final String mailFrom;
    private final String mailHost;
    private final String mailUsername;
    private final String mailPassword;

    public VictimEmailVerificationServiceImpl(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${gbvmonitor.verification.pin-expiration-minutes:10}") long pinExpirationMinutes,
            @Value("${gbvmonitor.mail.from:no-reply@gbvmonitor.local}") String mailFrom,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.password:}") String mailPassword) {
        this.mailSenderProvider = mailSenderProvider;
        this.pinExpiration = Duration.ofMinutes(pinExpirationMinutes);
        this.mailFrom = mailFrom;
        this.mailHost = mailHost;
        this.mailUsername = mailUsername;
        this.mailPassword = mailPassword;
    }

    @Override
    public String requestVerificationPin(RegisterRequest request) {
        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email address is required for email verification.");
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Password is required.");
        }

        String email = request.getEmail().trim().toLowerCase();
        String pin = String.format("%06d", secureRandom.nextInt(1_000_000));
        pendingRegistrations.put(email, new PendingVictimRegistration(request, pin, Instant.now().plus(pinExpiration)));
        return sendVerificationEmail(email, pin) ? null : pin;
    }

    @Override
    public RegisterRequest verifyPin(VerificationPinRequest request) {
        if (!StringUtils.hasText(request.getEmail()) || !StringUtils.hasText(request.getPin())) {
            throw new IllegalArgumentException("Email and PIN are required.");
        }

        String email = request.getEmail().trim().toLowerCase();
        PendingVictimRegistration pendingRegistration = pendingRegistrations.get(email);
        if (pendingRegistration == null) {
            throw new IllegalArgumentException("No pending verification was found for this email address.");
        }
        if (pendingRegistration.expiresAt().isBefore(Instant.now())) {
            pendingRegistrations.remove(email);
            throw new IllegalArgumentException("Your verification PIN has expired. Please request a new one.");
        }
        if (!pendingRegistration.pin().equals(request.getPin().trim())) {
            throw new IllegalArgumentException("The verification PIN you entered is incorrect.");
        }

        pendingRegistrations.remove(email);
        return pendingRegistration.request();
    }

    private boolean sendVerificationEmail(String email, String pin) {
        if (!isMailConfigured()) {
            return false;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("JavaMailSender is not available. Check your mail configuration.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("Your GBV Monitor verification PIN");
        message.setText("""
                Welcome to GBV Monitor.

                Your victim account verification PIN is: %s

                This PIN expires in %d minutes.

                If you did not request this PIN, you can ignore this email.
                """.formatted(pin, pinExpiration.toMinutes()));
        try {
            mailSender.send(message);
            return true;
        } catch (MailException ex) {
            throw new IllegalStateException("Email delivery failed. Please check the SMTP username, password, and provider settings.", ex);
        }
    }

    private boolean isMailConfigured() {
        return StringUtils.hasText(mailHost)
                && StringUtils.hasText(mailUsername)
                && StringUtils.hasText(mailPassword);
    }

    private record PendingVictimRegistration(RegisterRequest request, String pin, Instant expiresAt) {
    }
}
