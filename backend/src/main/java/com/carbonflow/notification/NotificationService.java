package com.carbonflow.notification;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationDto> getUserNotifications(String userId, String organizationId, int limit) {
        return notificationRepository.findForUser(userId, organizationId, limit);
    }

    public int getUnreadCount(String userId, String organizationId) {
        return notificationRepository.getUnreadCount(userId, organizationId);
    }

    public void markAsRead(String id, String userId) {
        notificationRepository.markAsRead(id, userId);
    }

    public void markAllAsRead(String userId, String organizationId) {
        notificationRepository.markAllAsRead(userId, organizationId);
    }
}
