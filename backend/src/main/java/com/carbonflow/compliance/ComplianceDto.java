package com.carbonflow.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ComplianceDto(
    String id,
    String organizationId,
    String requirementCode,
    String framework,
    String requirementName,
    String description,
    String applicability,
    String ownerId,
    String ownerName,
    String status,
    LocalDate dueDate,
    String linkedEvidenceId,
    String linkedEvidenceName,
    String linkedAuditId,
    String linkedAuditName,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record CreateUpdateRequest(
        String requirementCode,
        String framework,
        String requirementName,
        String description,
        String applicability,
        String ownerId,
        String status,
        LocalDate dueDate,
        String linkedEvidenceId,
        String linkedAuditId,
        String notes
    ) {}
}
