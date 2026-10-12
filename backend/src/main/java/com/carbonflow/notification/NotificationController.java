package com.carbonflow.notification;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> getNotifications(@RequestParam(required = false, defaultValue = "20") int limit) {
        String userId = SecurityUtils.getCurrentUserId();
        String orgId = SecurityUtils.getCurrentOrganizationId();
        List<NotificationDto> items = notificationService.getUserNotifications(userId, orgId, limit);
        int unread = notificationService.getUnreadCount(userId, orgId);
        return ApiResponse.ok(Map.of("items", items, "unreadCount", unread));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable String id) {
        String userId = SecurityUtils.getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ApiResponse.ok("Notification marked as read", null);
    }

    @PostMapping("/mark-all-read")
    public ApiResponse<Void> markAllAsRead() {
        String userId = SecurityUtils.getCurrentUserId();
        String orgId = SecurityUtils.getCurrentOrganizationId();
        notificationService.markAllAsRead(userId, orgId);
        return ApiResponse.ok("All notifications marked as read", null);
    }
}
