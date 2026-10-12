package com.carbonflow.finding;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record FindingDto(
    String id,
    String organizationId,
    String auditId,
    String auditName,
    String title,
    String description,
    String severity,
    String source,
    String relatedCarbonDataId,
    String relatedEvidenceId,
    String ownerId,
    String ownerName,
    String status,
    LocalDate dueDate,
    LocalDateTime resolutionDate,
    String resolutionNotes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record CreateUpdateRequest(
        String auditId,
        String title,
        String description,
        String severity,
        String source,
        String relatedCarbonDataId,
        String relatedEvidenceId,
        String ownerId,
        String status,
        LocalDate dueDate,
        String resolutionNotes
    ) {}
}
