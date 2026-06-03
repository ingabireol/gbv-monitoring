package com.gbvmonitor.websocket;

import com.gbvmonitor.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public void sendNotificationToUser(String userId, NotificationResponse notification) {
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
    }

    public void sendGlobalNotification(NotificationResponse notification) {
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
