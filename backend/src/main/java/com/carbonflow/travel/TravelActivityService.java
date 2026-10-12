package com.carbonflow.travel;

import com.carbonflow.auditlog.AuditLogService;
import com.carbonflow.carbon.CarbonDataDto;
import com.carbonflow.carbon.CarbonDataService;
import com.carbonflow.carbon.EmissionFactorDto;
import com.carbonflow.carbon.EmissionFactorRepository;
import com.carbonflow.security.SecurityUtils;
import com.carbonflow.security.UserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TravelActivityService {

    private static final Logger logger = LoggerFactory.getLogger(TravelActivityService.class);

    private final GoogleMapsRoutingService routingService;
    private final TravelActivityRepository travelRepository;
    private final EmissionFactorRepository emissionFactorRepository;
    private final CarbonDataService carbonDataService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public TravelActivityService(
            GoogleMapsRoutingService routingService,
            TravelActivityRepository travelRepository,
            EmissionFactorRepository emissionFactorRepository,
            CarbonDataService carbonDataService,
            AuditLogService auditLogService) {
        this.routingService = routingService;
        this.travelRepository = travelRepository;
        this.emissionFactorRepository = emissionFactorRepository;
        this.carbonDataService = carbonDataService;
        this.auditLogService = auditLogService;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Compute a live route preview with distance and duration via Google Maps Routes API v2.
     * Does NOT persist the route to the database.
     */
    public TravelActivityDto.RoutePreviewResponse computeRoutePreview(TravelActivityDto.RoutePreviewRequest request) {
        if (request.origin() == null || request.origin().trim().isBlank()) {
            throw new IllegalArgumentException("Origin address cannot be blank.");
        }
        if (request.destination() == null || request.destination().trim().isBlank()) {
            throw new IllegalArgumentException("Destination address cannot be blank.");
        }
        TravelMode mode = request.travelMode() != null ? request.travelMode() : TravelMode.DRIVE;
        TripType tripType = request.tripType() != null ? request.tripType() : TripType.ONE_WAY;

        GoogleMapsRoutingService.RouteResult route = routingService.computeRoute(
                request.origin().trim(),
                request.destination().trim(),
                request.waypoints(),
                mode
        );

        double oneWayKm = BigDecimal.valueOf(route.distanceMeters())
                .divide(BigDecimal.valueOf(1000.0), 3, RoundingMode.HALF_UP)
                .doubleValue();

        double totalKm = tripType == TripType.ROUND_TRIP
                ? BigDecimal.valueOf(oneWayKm).multiply(BigDecimal.valueOf(2.0)).setScale(3, RoundingMode.HALF_UP).doubleValue()
                : oneWayKm;

        String formattedDuration = formatDuration(route.durationSeconds(), tripType);

        return new TravelActivityDto.RoutePreviewResponse(
                request.origin().trim(),
                request.destination().trim(),
                mode,
                tripType,
                route.distanceMeters(),
                oneWayKm,
                totalKm,
                route.durationSeconds(),
                formattedDuration,
                route.routeSummary(),
                route.encodedPolyline(),
                route.routingProvider(),
                route.routingService(),
                route.calculatedAt()
        );
    }

    /**
     * Create and persist a new travel activity with optional automated carbon calculation.
     */
    @Transactional
    public TravelActivityDto createTravelActivity(String organizationId, TravelActivityDto.CreateTravelRequest request) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        String currentUserId = currentUser != null ? currentUser.getId() : "SYSTEM";
        String userName = currentUser != null ? currentUser.getFullName() : "Employee";

        if (request.originAddress() == null || request.originAddress().trim().isBlank()) {
            throw new IllegalArgumentException("Origin address is required.");
        }
        if (request.destinationAddress() == null || request.destinationAddress().trim().isBlank()) {
            throw new IllegalArgumentException("Destination address is required.");
        }
        if (request.travelDate() == null) {
            throw new IllegalArgumentException("Travel date is required.");
        }

        TravelMode mode = request.travelMode() != null ? request.travelMode() : TravelMode.DRIVE;
        TripType tripType = request.tripType() != null ? request.tripType() : TripType.ONE_WAY;
        int passengers = Math.max(1, request.passengerCount());

        // Validate or compute canonical distance
        double oneWayKm = request.oneWayDistanceKm();
        if (oneWayKm <= 0) {
            GoogleMapsRoutingService.RouteResult route = routingService.computeRoute(
                    request.originAddress().trim(),
                    request.destinationAddress().trim(),
                    request.waypoints(),
                    mode
            );
            oneWayKm = BigDecimal.valueOf(route.distanceMeters())
                    .divide(BigDecimal.valueOf(1000.0), 3, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        double totalKm = tripType == TripType.ROUND_TRIP
                ? BigDecimal.valueOf(oneWayKm).multiply(BigDecimal.valueOf(2.0)).setScale(3, RoundingMode.HALF_UP).doubleValue()
                : oneWayKm;

        // Resolve Emission Factor
        EmissionFactorDto factor = resolveEmissionFactor(organizationId, mode, request.vehicleType(), request.emissionFactorId());
        double factorValue = factor.factorValue();

        // Calculate emissions: total distance (km) * passenger count * emission factor
        // Canonical activity data in passenger-km
        double activityAmountPassengerKm = BigDecimal.valueOf(totalKm)
                .multiply(BigDecimal.valueOf(passengers))
                .setScale(3, RoundingMode.HALF_UP)
                .doubleValue();

        double calculatedEmissions = BigDecimal.valueOf(activityAmountPassengerKm)
                .multiply(BigDecimal.valueOf(factorValue))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        String travelId = UUID.randomUUID().toString();
        String carbonDataId = null;
        String status = "PENDING";

        // Auto-integrate with CarbonFlow's core CarbonData calculation engine if requested
        if (request.autoCalculateCarbon()) {
            String reportingPeriod = String.valueOf(request.travelDate().getYear());
            String provenanceNote = String.format("Travel ID: %s | Mode: %s (%s) | One-way: %.2f km | Total: %.2f km | Passengers: %d | Provider: Google Maps Routes API v2",
                    travelId, mode.name(), request.vehicleType() != null ? request.vehicleType() : "Standard", oneWayKm, totalKm, passengers);

            CarbonDataDto.CreateUpdateRequest carbonReq = new CarbonDataDto.CreateUpdateRequest(
                    reportingPeriod,
                    "SCOPE_3",
                    "Business Travel",
                    factor.activityType(),
                    activityAmountPassengerKm,
                    "passenger-km",
                    factorValue,
                    "Google Maps Platform Routes API v2 (" + request.originAddress().trim() + " → " + request.destinationAddress().trim() + ")",
                    userName,
                    "VALIDATED",
                    provenanceNote
            );

            CarbonDataDto createdCarbon = carbonDataService.createRecord(organizationId, carbonReq);
            carbonDataId = createdCarbon.id();
            status = "CALCULATED";
        }

        String waypointsJson = null;
        if (request.waypoints() != null && !request.waypoints().isEmpty()) {
            try {
                waypointsJson = objectMapper.writeValueAsString(request.waypoints());
            } catch (JsonProcessingException e) {
                logger.warn("Could not serialize waypoints to JSON", e);
            }
        }

        // Audit Provenance Metadata (Google Maps metadata without illegal geometry storage)
        Map<String, Object> provenance = new LinkedHashMap<>();
        provenance.put("routingProvider", "GOOGLE_MAPS");
        provenance.put("routingService", "ROUTES_API_V2");
        provenance.put("solutionAttribution", "gmp_mcp_codeassist_v1_aistudio");
        provenance.put("routeCalculatedAt", LocalDateTime.now().toString());
        provenance.put("oneWayDistanceKm", oneWayKm);
        provenance.put("totalDistanceKm", totalKm);
        provenance.put("passengerCount", passengers);
        provenance.put("activityAmountPassengerKm", activityAmountPassengerKm);
        provenance.put("factorValue", factorValue);
        provenance.put("factorUnit", factor.factorUnit());
        provenance.put("factorSource", factor.sourceReference());

        String provenanceJson = "{}";
        try {
            provenanceJson = objectMapper.writeValueAsString(provenance);
        } catch (JsonProcessingException e) {
            logger.warn("Could not serialize provenance metadata", e);
        }

        TravelActivityDto dto = new TravelActivityDto(
                travelId,
                organizationId,
                currentUserId,
                userName,
                request.title() != null && !request.title().isBlank()
                        ? request.title().trim()
                        : "Business Travel: " + request.originAddress().trim() + " to " + request.destinationAddress().trim(),
                request.travelDate(),
                tripType,
                mode,
                request.vehicleType() != null ? request.vehicleType() : factor.activityType(),
                request.originAddress().trim(),
                request.destinationAddress().trim(),
                waypointsJson,
                passengers,
                oneWayKm,
                totalKm,
                request.durationSeconds(),
                "GOOGLE_MAPS",
                "ROUTES_API_V2",
                LocalDateTime.now(),
                request.routeSummary() != null ? request.routeSummary() : mode.getDisplayName(),
                factor.id(),
                factorValue,
                calculatedEmissions,
                carbonDataId,
                status,
                request.notes(),
                provenanceJson,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        travelRepository.insert(dto);

        auditLogService.log(organizationId, "CREATE", "TRAVEL_ACTIVITY", travelId,
                String.format("{\"mode\":\"%s\",\"totalKm\":%.2f,\"emissions\":%.4f,\"carbonDataId\":\"%s\"}",
                        mode.name(), totalKm, calculatedEmissions, carbonDataId));

        return dto;
    }

    public List<TravelActivityDto> getTravelActivities(String organizationId, String userId, String status, String travelMode, int limit, int offset) {
        return travelRepository.findAllByOrg(organizationId, userId, status, travelMode, limit, offset);
    }

    public int countTravelActivities(String organizationId, String userId, String status, String travelMode) {
        return travelRepository.countByOrg(organizationId, userId, status, travelMode);
    }

    public TravelActivityDto getTravelActivity(String id, String organizationId) {
        return travelRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Travel activity not found or access denied."));
    }

    /**
     * Compute and link emissions to the central CarbonFlow ledger for an existing travel activity.
     */
    @Transactional
    public TravelActivityDto calculateAndSyncCarbon(String travelId, String organizationId) {
        TravelActivityDto existing = getTravelActivity(travelId, organizationId);
        if ("CALCULATED".equalsIgnoreCase(existing.status()) && existing.carbonDataId() != null) {
            return existing;
        }

        EmissionFactorDto factor = resolveEmissionFactor(organizationId, existing.travelMode(), existing.vehicleType(), existing.emissionFactorId());
        double activityAmount = BigDecimal.valueOf(existing.totalDistanceKm())
                .multiply(BigDecimal.valueOf(existing.passengerCount()))
                .setScale(3, RoundingMode.HALF_UP)
                .doubleValue();

        double emissions = BigDecimal.valueOf(activityAmount)
                .multiply(BigDecimal.valueOf(factor.factorValue()))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        String reportingPeriod = String.valueOf(existing.travelDate().getYear());
        String userName = existing.userFullName() != null ? existing.userFullName() : "Employee";

        CarbonDataDto.CreateUpdateRequest carbonReq = new CarbonDataDto.CreateUpdateRequest(
                reportingPeriod,
                "SCOPE_3",
                "Business Travel",
                factor.activityType(),
                activityAmount,
                "passenger-km",
                factor.factorValue(),
                "Google Maps Platform Routes API v2 (" + existing.originAddress() + " → " + existing.destinationAddress() + ")",
                userName,
                "VALIDATED",
                String.format("Linked Travel Activity: %s | Distance: %.2f km | Mode: %s", existing.id(), existing.totalDistanceKm(), existing.travelMode().name())
        );

        CarbonDataDto carbonDto = carbonDataService.createRecord(organizationId, carbonReq);

        travelRepository.updateCarbonLink(travelId, organizationId, carbonDto.id(), emissions, "CALCULATED");

        auditLogService.log(organizationId, "CALCULATE", "TRAVEL_ACTIVITY", travelId,
                String.format("{\"carbonDataId\":\"%s\",\"emissions\":%.4f}", carbonDto.id(), emissions));

        return getTravelActivity(travelId, organizationId);
    }

    public void deleteTravelActivity(String travelId, String organizationId) {
        TravelActivityDto existing = getTravelActivity(travelId, organizationId);
        travelRepository.delete(travelId, organizationId);
        auditLogService.log(organizationId, "DELETE", "TRAVEL_ACTIVITY", travelId,
                String.format("{\"origin\":\"%s\",\"destination\":\"%s\"}", existing.originAddress(), existing.destinationAddress()));
    }

    private EmissionFactorDto resolveEmissionFactor(String organizationId, TravelMode mode, String vehicleType, String specificFactorId) {
        List<EmissionFactorDto> factors = emissionFactorRepository.findAllForOrganization(organizationId);

        if (specificFactorId != null && !specificFactorId.isBlank()) {
            for (EmissionFactorDto f : factors) {
                if (f.id().equals(specificFactorId)) {
                    return f;
                }
            }
        }

        // Keyword resolution by mode
        if (mode == TravelMode.WALK || mode == TravelMode.BICYCLE) {
            return factors.stream()
                    .filter(f -> f.activityType().toLowerCase().contains("active mobility") || f.activityType().toLowerCase().contains("bicycle"))
                    .findFirst()
                    .orElse(new EmissionFactorDto("ef-active", null, "Business Travel", "Active Mobility (Zero Direct)", "SCOPE_3", "passenger-km", 0.0, "tCO2e/p-km", "GHG Protocol", 2024));
        }

        if (mode == TravelMode.TRANSIT) {
            return factors.stream()
                    .filter(f -> f.activityType().toLowerCase().contains("rail") || f.activityType().toLowerCase().contains("train") || f.activityType().toLowerCase().contains("bus"))
                    .findFirst()
                    .orElse(new EmissionFactorDto("ef-transit", null, "Business Travel", "Public Transit (Passenger Rail)", "SCOPE_3", "passenger-km", 0.000035, "tCO2e/p-km", "DEFRA 2024", 2024));
        }

        if (mode == TravelMode.DRIVE) {
            if (vehicleType != null && vehicleType.toLowerCase().contains("electric")) {
                return factors.stream()
                        .filter(f -> f.activityType().toLowerCase().contains("electric"))
                        .findFirst()
                        .orElse(new EmissionFactorDto("ef-ev", null, "Business Travel", "Passenger Car (Electric Vehicle)", "SCOPE_3", "passenger-km", 0.000053, "tCO2e/p-km", "EPA 2024", 2024));
            }
            return factors.stream()
                    .filter(f -> f.activityType().toLowerCase().contains("passenger car (gasoline") || f.activityType().toLowerCase().contains("passenger car"))
                    .findFirst()
                    .orElse(new EmissionFactorDto("ef-car", null, "Business Travel", "Passenger Car (Gasoline Average)", "SCOPE_3", "passenger-km", 0.000170, "tCO2e/p-km", "EPA 2024", 2024));
        }

        // Default fallback to first travel factor or generic
        return factors.stream()
                .filter(f -> "Business Travel".equalsIgnoreCase(f.category()))
                .findFirst()
                .orElse(new EmissionFactorDto("ef-default", null, "Business Travel", "General Business Travel", "SCOPE_3", "passenger-km", 0.000170, "tCO2e/p-km", "EPA 2024", 2024));
    }

    private String formatDuration(int durationSeconds, TripType tripType) {
        int totalSec = tripType == TripType.ROUND_TRIP ? durationSeconds * 2 : durationSeconds;
        int hours = totalSec / 3600;
        int minutes = (totalSec % 3600) / 60;
        if (hours > 0) {
            return hours + " hr " + minutes + " min";
        }
        return Math.max(1, minutes) + " min";
    }
}
