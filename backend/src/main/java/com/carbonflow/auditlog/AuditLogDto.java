package com.carbonflow.auditlog;

import java.time.LocalDateTime;

public record AuditLogDto(
    String id,
    String organizationId,
    String actorId,
    String actorName,
    String actorEmail,
    String action,
    String entityType,
    String entityId,
    String metadata,
    String ipAddress,
    LocalDateTime createdAt
) {}
