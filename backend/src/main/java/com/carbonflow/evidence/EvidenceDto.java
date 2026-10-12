package com.carbonflow.evidence;

import java.time.LocalDateTime;

public record EvidenceDto(
    String id,
    String organizationId,
    String evidenceName,
    String evidenceType,
    String reportingPeriod,
    String source,
    String owner,
    LocalDateTime uploadDate,
    String status,
    String description,
    String fileUrl,
    long fileSizeBytes,
    String mimeType,
    String linkedCarbonDataId,
    String linkedAuditId,
    String verifiedBy,
    LocalDateTime verifiedAt,
    String verificationNotes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record CreateUpdateRequest(
        String evidenceName,
        String evidenceType,
        String reportingPeriod,
        String source,
        String owner,
        String description,
        String fileUrl,
        Long fileSizeBytes,
        String mimeType,
        String linkedCarbonDataId,
        String linkedAuditId
    ) {}

    public record VerifyRequest(
        String status, // VERIFIED or REJECTED
        String verificationNotes
    ) {}
}
