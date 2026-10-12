package com.carbonflow.travel;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record TravelActivityDto(
    String id,
    String organizationId,
    String userId,
    String userFullName,
    String title,
    LocalDate travelDate,
    TripType tripType,
    TravelMode travelMode,
    String vehicleType,
    String originAddress,
    String destinationAddress,
    String waypointsJson,
    int passengerCount,
    double oneWayDistanceKm,
    double totalDistanceKm,
    int durationSeconds,
    String routingProvider,
    String routingService,
    LocalDateTime routeCalculatedAt,
    String routeSummary,
    String emissionFactorId,
    Double emissionFactorValue,
    Double calculatedEmissions,
    String carbonDataId,
    String status,
    String notes,
    String provenanceMetadata,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record RoutePreviewRequest(
        String origin,
        String destination,
        List<String> waypoints,
        TravelMode travelMode,
        TripType tripType
    ) {}

    public record RoutePreviewResponse(
        String origin,
        String destination,
        TravelMode travelMode,
        TripType tripType,
        long oneWayDistanceMeters,
        double oneWayDistanceKm,
        double totalDistanceKm,
        int durationSeconds,
        String formattedDuration,
        String routeSummary,
        String encodedPolyline,
        String routingProvider,
        String routingService,
        LocalDateTime calculatedAt
    ) {}

    public record CreateTravelRequest(
        String title,
        LocalDate travelDate,
        TripType tripType,
        TravelMode travelMode,
        String vehicleType,
        String originAddress,
        String destinationAddress,
        List<String> waypoints,
        int passengerCount,
        double oneWayDistanceKm,
        double totalDistanceKm,
        int durationSeconds,
        String routeSummary,
        String notes,
        String emissionFactorId,
        boolean autoCalculateCarbon
    ) {}
}
