package com.carbonflow.carbon;

import java.time.LocalDateTime;

public record CarbonDataDto(
    String id,
    String organizationId,
    String reportingPeriod,
    String scope,
    String category,
    String activityType,
    double activityAmount,
    String unit,
    double emissionFactor,
    double calculatedEmissions,
    String source,
    String dataOwner,
    String status,
    String notes,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record CreateUpdateRequest(
        String reportingPeriod,
        String scope,
        String category,
        String activityType,
        double activityAmount,
        String unit,
        Double emissionFactor,
        String source,
        String dataOwner,
        String status,
        String notes
    ) {}
}
