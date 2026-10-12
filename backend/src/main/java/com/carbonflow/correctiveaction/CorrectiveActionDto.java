package com.carbonflow.correctiveaction;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CorrectiveActionDto(
    String id,
    String organizationId,
    String findingId,
    String findingTitle,
    String findingSeverity,
    String actionTitle,
    String description,
    String ownerId,
    String ownerName,
    String priority,
    LocalDate dueDate,
    String status,
    LocalDateTime completionDate,
    String completionNotes,
    String completionEvidenceId,
    boolean isOverdue,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record CreateUpdateRequest(
        String findingId,
        String actionTitle,
        String description,
        String ownerId,
        String priority,
        LocalDate dueDate,
        String status,
        String completionNotes,
        String completionEvidenceId
    ) {}
}
