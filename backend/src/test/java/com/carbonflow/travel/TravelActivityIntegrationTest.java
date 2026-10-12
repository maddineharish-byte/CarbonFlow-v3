package com.carbonflow.travel;

import com.carbonflow.common.TenantContext;
import com.carbonflow.security.UserPrincipal;
import com.carbonflow.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TravelActivityIntegrationTest {

    @Autowired
    private TravelActivityService travelActivityService;

    @Autowired
    private TravelActivityRepository travelActivityRepository;

    private static final String ORG_A = "org-demo-001";
    private static final String ORG_B = "org-other-002";

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_A);
        UserPrincipal principal = new UserPrincipal(
                "usr-admin-001",
                "admin@carbonflow.io",
                "",
                "Sarah Chen",
                ORG_A,
                UserRole.COMPANY_ADMIN,
                true
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("End-to-End: Create travel activity, verify distance and auto-calculated Scope 3 carbon entry")
    void testCreateTravelActivityWithCarbonCalculation() {
        TravelActivityDto.CreateTravelRequest request = new TravelActivityDto.CreateTravelRequest(
                "Client Site Audit - Chicago to Milwaukee",
                LocalDate.of(2025, 3, 15),
                TripType.ROUND_TRIP,
                TravelMode.DRIVE,
                "Passenger Car (Gasoline Average)",
                "200 S Wacker Dr, Chicago, IL",
                "100 E Wisconsin Ave, Milwaukee, WI",
                null,
                2,
                148.5,
                297.0,
                7200,
                "I-94 N route via Kenosha",
                "Onsite ESG data verification visit",
                "ef-travel-001",
                true
        );

        TravelActivityDto created = travelActivityService.createTravelActivity(ORG_A, request);

        assertNotNull(created.id());
        assertEquals(ORG_A, created.organizationId());
        assertEquals("usr-admin-001", created.userId());
        assertEquals(148.5, created.oneWayDistanceKm(), 0.001);
        assertEquals(297.0, created.totalDistanceKm(), 0.001);
        assertEquals(2, created.passengerCount());
        assertEquals("CALCULATED", created.status());
        assertNotNull(created.carbonDataId());
        assertTrue(created.calculatedEmissions() > 0.0);

        // Verify retrieval
        TravelActivityDto retrieved = travelActivityService.getTravelActivity(created.id(), ORG_A);
        assertEquals(created.id(), retrieved.id());
        assertEquals(created.carbonDataId(), retrieved.carbonDataId());
        assertTrue(retrieved.provenanceMetadata().contains("GOOGLE_MAPS"));
        assertTrue(retrieved.provenanceMetadata().contains("ROUTES_API_V2"));
    }

    @Test
    @DisplayName("Tenant Isolation: Organization B cannot access Organization A's travel activity")
    void testTenantIsolationRejection() {
        // Create under Org A
        TravelActivityDto.CreateTravelRequest request = new TravelActivityDto.CreateTravelRequest(
                "Internal Staff Commute",
                LocalDate.of(2025, 3, 20),
                TripType.ONE_WAY,
                TravelMode.TRANSIT,
                "Public Transit (Passenger Rail / Train)",
                "San Francisco Caltrain Station",
                "Palo Alto Caltrain Station",
                null,
                1,
                52.0,
                52.0,
                3000,
                "Caltrain Express Line",
                "Commute data",
                "ef-travel-004",
                false
        );

        TravelActivityDto created = travelActivityService.createTravelActivity(ORG_A, request);

        // Attempt retrieval using Org B context
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                travelActivityService.getTravelActivity(created.id(), ORG_B)
        );
        assertTrue(ex.getMessage().contains("access denied") || ex.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Route Preview: Preview route calculation without persisting record")
    void testRoutePreviewWithoutPersistence() {
        int initialCount = travelActivityService.countTravelActivities(ORG_A, null, "ALL", "ALL");

        TravelActivityDto.RoutePreviewRequest previewReq = new TravelActivityDto.RoutePreviewRequest(
                "Market St, San Francisco, CA",
                "University Ave, Palo Alto, CA",
                null,
                TravelMode.DRIVE,
                TripType.ONE_WAY
        );

        TravelActivityDto.RoutePreviewResponse preview = travelActivityService.computeRoutePreview(previewReq);

        assertNotNull(preview);
        assertTrue(preview.oneWayDistanceKm() > 0);
        assertEquals(preview.oneWayDistanceKm(), preview.totalDistanceKm(), 0.001);
        assertEquals("GOOGLE_MAPS", preview.routingProvider());
        assertEquals("ROUTES_API_V2", preview.routingService());

        // Count must remain unchanged
        int postCount = travelActivityService.countTravelActivities(ORG_A, null, "ALL", "ALL");
        assertEquals(initialCount, postCount);
    }
}
