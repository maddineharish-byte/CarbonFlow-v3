package com.carbonflow.organization;

import java.time.LocalDateTime;

public record OrganizationDto(
    String id,
    String name,
    String industry,
    String country,
    String location,
    String description,
    String reportingPeriod,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
