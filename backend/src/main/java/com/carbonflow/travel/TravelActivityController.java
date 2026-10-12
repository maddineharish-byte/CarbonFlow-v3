package com.carbonflow.travel;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import com.carbonflow.security.UserPrincipal;
import com.carbonflow.user.UserRole;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/travel")
public class TravelActivityController {

    private final TravelActivityService travelService;

    public TravelActivityController(TravelActivityService travelService) {
        this.travelService = travelService;
    }

    /**
     * Compute a live preview of a route using Google Maps Routes API v2.
     * Accessible by all authenticated tenant employees and managers.
     */
    @PostMapping("/route")
    public ResponseEntity<ApiResponse<TravelActivityDto.RoutePreviewResponse>> calculateRoutePreview(
            @RequestBody TravelActivityDto.RoutePreviewRequest request) {
        TravelActivityDto.RoutePreviewResponse preview = travelService.computeRoutePreview(request);
        return ResponseEntity.ok(ApiResponse.ok("Route calculated successfully via Google Maps.", preview));
    }

    /**
     * Create and record a new travel activity with Google Maps provenance.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TravelActivityDto>> createTravelActivity(
            @RequestBody TravelActivityDto.CreateTravelRequest request) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        TravelActivityDto created = travelService.createTravelActivity(orgId, request);
        return ResponseEntity.ok(ApiResponse.ok("Travel activity recorded successfully.", created));
    }

    /**
     * List travel activities for the current tenant organization.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTravelActivities(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String travelMode,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        // If an EMPLOYEE without elevated role requests activities, restrict to own entries
        String effectiveUserId = userId;
        if (currentUser != null && currentUser.getRole() == UserRole.EMPLOYEE) {
            effectiveUserId = currentUser.getId();
        }

        int offset = (Math.max(1, page) - 1) * size;
        List<TravelActivityDto> items = travelService.getTravelActivities(orgId, effectiveUserId, status, travelMode, size, offset);
        int total = travelService.countTravelActivities(orgId, effectiveUserId, status, travelMode);

        Map<String, Object> data = Map.of(
                "items", items,
                "total", total,
                "page", page,
                "size", size,
                "totalPages", (int) Math.ceil((double) total / size)
        );

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /**
     * Get a specific travel activity by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TravelActivityDto>> getTravelActivity(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        TravelActivityDto activity = travelService.getTravelActivity(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok(activity));
    }

    /**
     * Formally compute emissions and link the travel activity to CarbonFlow's core Carbon Data ledger.
     */
    @PostMapping("/{id}/calculate")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TravelActivityDto>> calculateAndSyncCarbon(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        TravelActivityDto updated = travelService.calculateAndSyncCarbon(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok("Emissions calculated and recorded in carbon ledger.", updated));
    }

    /**
     * Delete or cancel a travel activity.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> deleteTravelActivity(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        travelService.deleteTravelActivity(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok("Travel activity removed successfully.", null));
    }
}
