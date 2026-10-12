package com.carbonflow.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AuditDto(
    String id,
    String organizationId,
    String auditName,
    String auditPeriod,
    String auditType,
    String scope,
    String leadAuditor,
    LocalDate startDate,
    LocalDate dueDate,
    String status,
    String description,
    String completionNotes,
    LocalDateTime closedAt,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<AuditCarbonLinkDto> linkedCarbonData
) {
    public record CreateUpdateRequest(
        String auditName,
        String auditPeriod,
        String auditType,
        String scope,
        String leadAuditor,
        LocalDate startDate,
        LocalDate dueDate,
        String status,
        String description,
        String completionNotes,
        List<String> carbonDataIds
    ) {}

    public record AuditCarbonLinkDto(
        String id,
        String auditId,
        String carbonDataId,
        String scope,
        String category,
        String activityType,
        double calculatedEmissions,
        String status,
        String reviewerId,
        String reviewerComments,
        LocalDateTime reviewedAt
    ) {}

    public record ValidateCarbonRequest(
        String status, // VALIDATED, NEEDS_REVIEW, REJECTED
        String comments
    ) {}
}
