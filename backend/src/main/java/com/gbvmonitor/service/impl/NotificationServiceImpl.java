package com.gbvmonitor.service.impl;

import com.gbvmonitor.dto.NotificationRequest;
import com.gbvmonitor.dto.NotificationResponse;
import com.gbvmonitor.entity.Notification;
import com.gbvmonitor.entity.User;
import com.gbvmonitor.repository.NotificationRepository;
import com.gbvmonitor.repository.UserRepository;
import com.gbvmonitor.service.AccessControlService;
import com.gbvmonitor.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        User user = userRepository.findById(request.getUserId()).orElseThrow();
        Notification notification = Notification.builder()
                .user(user)
                .type(request.getType())
                .message(request.getMessage())
                .read(false)
                .createdAt(new Date())
                .build();
        notificationRepository.save(notification);
        return toResponse(notification);
    }

    @Override
    public List<NotificationResponse> getNotificationsByUser(UUID userId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        if (!actor.getId().equals(userId) && !accessControlService.isAdmin(actor)) {
            throw new AccessDeniedException("You can only view your own notifications");
        }
        return notificationRepository.findAll().stream()
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(userId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UserDetails userDetails) {
        User actor = accessControlService.currentUser(userDetails);
        Notification notification = notificationRepository.findById(notificationId).orElseThrow();
        if (notification.getUser() == null || (!notification.getUser().getId().equals(actor.getId()) && !accessControlService.isAdmin(actor))) {
            throw new AccessDeniedException("You can only update your own notifications");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return toResponse(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
