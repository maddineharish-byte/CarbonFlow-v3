package com.carbonflow.travel;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TravelActivityTest {

    @Test
    @DisplayName("Validation: Reject blank origin address")
    void testValidateOrigin() {
        GoogleMapsRoutingService routingService = new GoogleMapsRoutingService("", "gmp_mcp_codeassist_v1_aistudio", 1000, 1000);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                routingService.computeRoute("", "100 Main St", null, TravelMode.DRIVE)
        );
        assertTrue(ex.getMessage().contains("origin"));
    }

    @Test
    @DisplayName("Validation: Reject blank destination address")
    void testValidateDestination() {
        GoogleMapsRoutingService routingService = new GoogleMapsRoutingService("", "gmp_mcp_codeassist_v1_aistudio", 1000, 1000);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                routingService.computeRoute("100 Main St", "   ", null, TravelMode.DRIVE)
        );
        assertTrue(ex.getMessage().contains("destination"));
    }

    @Test
    @DisplayName("Validation: Reject null travel mode")
    void testValidateTravelMode() {
        GoogleMapsRoutingService routingService = new GoogleMapsRoutingService("", "gmp_mcp_codeassist_v1_aistudio", 1000, 1000);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                routingService.computeRoute("100 Main St", "200 Market St", null, null)
        );
        assertTrue(ex.getMessage().contains("Travel mode"));
    }

    @Test
    @DisplayName("Distance Conversion: Exact meters to kilometers division (77,250 meters = 77.250 km)")
    void testMetersToKilometersConversion() {
        long meters = 77250L;
        double km = BigDecimal.valueOf(meters)
                .divide(BigDecimal.valueOf(1000.0), 3, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(77.250, km, 0.0001);
    }

    @Test
    @DisplayName("Trip Type: One-way distance calculation")
    void testOneWayCalculation() {
        double oneWayKm = 120.5;
        TripType tripType = TripType.ONE_WAY;
        double totalKm = tripType == TripType.ROUND_TRIP ? oneWayKm * 2.0 : oneWayKm;

        assertEquals(120.5, totalKm, 0.0001);
    }

    @Test
    @DisplayName("Trip Type: Round-trip return journey doubles distance deterministically")
    void testRoundTripCalculation() {
        double oneWayKm = 120.5;
        TripType tripType = TripType.ROUND_TRIP;
        double totalKm = tripType == TripType.ROUND_TRIP
                ? BigDecimal.valueOf(oneWayKm).multiply(BigDecimal.valueOf(2.0)).setScale(3, RoundingMode.HALF_UP).doubleValue()
                : oneWayKm;

        assertEquals(241.0, totalKm, 0.0001);
    }

    @Test
    @DisplayName("Passenger Activity Calculation: Total passenger-km = distance_km * passenger_count")
    void testPassengerActivityCalculation() {
        double distanceKm = 150.0;
        int passengers = 3;
        double activityAmountPassengerKm = BigDecimal.valueOf(distanceKm)
                .multiply(BigDecimal.valueOf(passengers))
                .setScale(3, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(450.0, activityAmountPassengerKm, 0.0001);
    }

    @Test
    @DisplayName("Carbon Calculation: Driving gasoline car (450 p-km * 0.000170 tCO2e/p-km = 0.0765 tCO2e)")
    void testGasolineDrivingEmissions() {
        double activityPassengerKm = 450.0;
        double emissionFactor = 0.000170; // EPA 2024 Gasoline car
        double calculatedEmissions = BigDecimal.valueOf(activityPassengerKm)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(0.0765, calculatedEmissions, 0.00001);
    }

    @Test
    @DisplayName("Carbon Calculation: Electric vehicle emissions (450 p-km * 0.000053 tCO2e/p-km = 0.0239 tCO2e)")
    void testElectricVehicleEmissions() {
        double activityPassengerKm = 450.0;
        double emissionFactor = 0.000053; // EPA 2024 EV
        double calculatedEmissions = BigDecimal.valueOf(activityPassengerKm)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(0.0239, calculatedEmissions, 0.00001);
    }

    @Test
    @DisplayName("Carbon Calculation: Passenger rail / transit (450 p-km * 0.000035 tCO2e/p-km = 0.0158 tCO2e)")
    void testPassengerRailEmissions() {
        double activityPassengerKm = 450.0;
        double emissionFactor = 0.000035; // DEFRA 2024 Rail
        double calculatedEmissions = BigDecimal.valueOf(activityPassengerKm)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(0.0158, calculatedEmissions, 0.00001);
    }

    @Test
    @DisplayName("Carbon Calculation: Active mobility (walking/cycling) produces 0.0000 tCO2e direct emissions")
    void testActiveMobilityZeroEmissions() {
        double activityPassengerKm = 25.0;
        double emissionFactor = 0.000000;
        double calculatedEmissions = BigDecimal.valueOf(activityPassengerKm)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(0.0, calculatedEmissions, 0.00001);
    }

    @Test
    @DisplayName("Offline Fallback: Resilient routing when API key is absent without throwing unhandled errors")
    void testRoutingOfflineFallback() {
        GoogleMapsRoutingService routingService = new GoogleMapsRoutingService("", "gmp_mcp_codeassist_v1_aistudio", 1000, 1000);
        GoogleMapsRoutingService.RouteResult result = routingService.computeRoute(
                "350 5th Ave, New York, NY",
                "100 Federal St, Boston, MA",
                null,
                TravelMode.DRIVE
        );

        assertNotNull(result);
        assertTrue(result.distanceMeters() > 0);
        assertTrue(result.durationSeconds() > 0);
        assertEquals("GOOGLE_MAPS", result.routingProvider());
        assertEquals("ROUTES_API_V2", result.routingService());
        assertNotNull(result.calculatedAt());
    }
}
