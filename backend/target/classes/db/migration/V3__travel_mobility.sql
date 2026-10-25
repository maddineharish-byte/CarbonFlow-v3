-- V3__travel_mobility.sql
-- CarbonFlow Travel & Mobility with Google Maps Routes Integration

-- 1. Travel Activities Table
CREATE TABLE travel_activities (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    travel_date DATE NOT NULL,
    trip_type VARCHAR(20) NOT NULL DEFAULT 'ONE_WAY',
    travel_mode VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(100),
    origin_address VARCHAR(500) NOT NULL,
    destination_address VARCHAR(500) NOT NULL,
    waypoints_json TEXT,
    passenger_count INT NOT NULL DEFAULT 1,
    one_way_distance_km DOUBLE PRECISION NOT NULL,
    total_distance_km DOUBLE PRECISION NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    routing_provider VARCHAR(50) NOT NULL DEFAULT 'GOOGLE_MAPS',
    routing_service VARCHAR(100) NOT NULL DEFAULT 'ROUTES_API_V2',
    route_calculated_at TIMESTAMP NOT NULL,
    route_summary VARCHAR(255),
    emission_factor_id VARCHAR(36) REFERENCES emission_factors(id) ON DELETE SET NULL,
    emission_factor_value DOUBLE PRECISION,
    calculated_emissions DOUBLE PRECISION,
    carbon_data_id VARCHAR(36) REFERENCES carbon_data(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    provenance_metadata TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Performance and Multi-Tenant Isolation Indexes
CREATE INDEX idx_travel_org ON travel_activities(organization_id);
CREATE INDEX idx_travel_user ON travel_activities(user_id);
CREATE INDEX idx_travel_date ON travel_activities(travel_date);
CREATE INDEX idx_travel_status ON travel_activities(status);
CREATE INDEX idx_travel_carbon ON travel_activities(carbon_data_id);

-- 2. Seed Standard Ground & Business Travel Emission Factors (Scope 3 Category 6)
INSERT INTO emission_factors (id, organization_id, category, activity_type, scope, unit, factor_value, factor_unit, source_reference, factor_year, created_at)
VALUES
('ef-travel-001', NULL, 'Business Travel', 'Passenger Car (Gasoline Average)', 'SCOPE_3', 'passenger-km', 0.000170, 'tCO2e/p-km', 'EPA GHG Emission Factors Hub 2024 / DEFRA', 2024, CURRENT_TIMESTAMP),
('ef-travel-002', NULL, 'Business Travel', 'Passenger Car (Electric Vehicle - Grid Avg)', 'SCOPE_3', 'passenger-km', 0.000053, 'tCO2e/p-km', 'EPA eGRID 2024 / DEFRA EV Factor', 2024, CURRENT_TIMESTAMP),
('ef-travel-003', NULL, 'Business Travel', 'Passenger Car (Hybrid Electric)', 'SCOPE_3', 'passenger-km', 0.000109, 'tCO2e/p-km', 'UK DEFRA / DESNZ 2024', 2024, CURRENT_TIMESTAMP),
('ef-travel-004', NULL, 'Business Travel', 'Public Transit (Passenger Rail / Train)', 'SCOPE_3', 'passenger-km', 0.000035, 'tCO2e/p-km', 'UK DEFRA / Amtrak Regional 2024', 2024, CURRENT_TIMESTAMP),
('ef-travel-005', NULL, 'Business Travel', 'Public Transit (City Bus)', 'SCOPE_3', 'passenger-km', 0.000089, 'tCO2e/p-km', 'EPA GHG Hub 2024 / DEFRA', 2024, CURRENT_TIMESTAMP),
('ef-travel-006', NULL, 'Business Travel', 'Active Mobility (Walking / Bicycle)', 'SCOPE_3', 'passenger-km', 0.000000, 'tCO2e/p-km', 'GHG Protocol Corporate Standard (Zero Direct)', 2024, CURRENT_TIMESTAMP),
('ef-travel-007', NULL, 'Business Travel', 'Taxi / Rideshare (Single Occupancy)', 'SCOPE_3', 'passenger-km', 0.000195, 'tCO2e/p-km', 'UK DEFRA / GLEC Framework 2024', 2024, CURRENT_TIMESTAMP);
