package com.carbonflow.notification;

import java.time.LocalDateTime;

public record NotificationDto(
    String id,
    String organizationId,
    String userId,
    String title,
    String message,
    String type,
    String referenceEntityType,
    String referenceEntityId,
    boolean read,
    LocalDateTime createdAt
) {}
