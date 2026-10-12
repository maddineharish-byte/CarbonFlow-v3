package com.carbonflow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CarbonCalculationTest {

    @Test
    @DisplayName("Verify Scope 1 Natural gas calculation: 18450 therms * 0.0053 tCO2e/therm = 97.785 tCO2e")
    void testScope1NaturalGasCalculation() {
        double activityAmount = 18450.0;
        double emissionFactor = 0.0053;
        double calculated = BigDecimal.valueOf(activityAmount)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(97.785, calculated, 0.0001);
    }

    @Test
    @DisplayName("Verify Scope 2 Purchased Electricity calculation: 1420500 kWh * 0.000215 = 305.4075 tCO2e")
    void testScope2ElectricityCalculation() {
        double activityAmount = 1420500.0;
        double emissionFactor = 0.000215;
        double calculated = BigDecimal.valueOf(activityAmount)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(305.4075, calculated, 0.0001);
    }

    @Test
    @DisplayName("Verify Scope 3 Air Travel calculation: 845000 passenger-km * 0.000102 = 86.19 tCO2e")
    void testScope3AirTravelCalculation() {
        double activityAmount = 845000.0;
        double emissionFactor = 0.000102;
        double calculated = BigDecimal.valueOf(activityAmount)
                .multiply(BigDecimal.valueOf(emissionFactor))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        assertEquals(86.19, calculated, 0.0001);
    }
}
