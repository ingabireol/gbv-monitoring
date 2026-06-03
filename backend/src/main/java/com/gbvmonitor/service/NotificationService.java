package com.gbvmonitor.service;

import com.gbvmonitor.dto.NotificationRequest;
import com.gbvmonitor.dto.NotificationResponse;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;
import java.util.UUID;

public interface NotificationService {
    NotificationResponse createNotification(NotificationRequest request);
    List<NotificationResponse> getNotificationsByUser(UUID userId, UserDetails userDetails);
    NotificationResponse markAsRead(UUID notificationId, UserDetails userDetails);
}
