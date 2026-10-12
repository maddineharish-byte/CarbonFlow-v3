package com.carbonflow.carbon;

import java.time.LocalDateTime;

public record EmissionFactorDto(
    String id,
    String organizationId,
    String category,
    String activityType,
    String scope,
    String unit,
    double factorValue,
    String factorUnit,
    String sourceReference,
    int factorYear
) {}
