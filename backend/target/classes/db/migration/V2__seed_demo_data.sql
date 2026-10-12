-- V2__seed_demo_data.sql
-- Seed data for CarbonFlow Demo Organization
-- Passwords: 'Password123!' (BCrypt hash: $2a$10$7v59J.C5985t84l.iV2bAODkX811lX2yB/wJgM3vPspN8/p9q00mC)

-- 1. Demo Organization
INSERT INTO organizations (id, name, industry, country, location, description, reporting_period, created_at, updated_at)
VALUES (
    'org-demo-001',
    'CarbonFlow Technologies Inc.',
    'Technology & Enterprise Software',
    'United States',
    'San Francisco, CA & Global Operations',
    'Global enterprise cloud infrastructure and SaaS provider tracking Net-Zero 2030 targets.',
    '2025',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. Demo Users (Admin, Sustainability Manager, Analyst, Employee)
-- BCrypt for 'Password123!'
INSERT INTO users (id, email, password_hash, full_name, title, phone, active, created_at, updated_at)
VALUES 
(
    'usr-admin-001',
    'admin@carbonflow.io',
    '$2a$10$e8w.b7r1Uv573kH.G8ZWeuJ3lq7w00Yk23xS05mHk82H9wK2m2kK6',
    'Sarah Chen',
    'Chief Operations & Governance Officer',
    '+1 (415) 555-0101',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'usr-mgr-002',
    'sustainability@carbonflow.io',
    '$2a$10$e8w.b7r1Uv573kH.G8ZWeuJ3lq7w00Yk23xS05mHk82H9wK2m2kK6',
    'Marcus Vance',
    'Head of ESG & Sustainability Auditing',
    '+1 (415) 555-0102',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'usr-analyst-003',
    'analyst@carbonflow.io',
    '$2a$10$e8w.b7r1Uv573kH.G8ZWeuJ3lq7w00Yk23xS05mHk82H9wK2m2kK6',
    'Elena Rostova',
    'Senior Carbon Accounting Analyst',
    '+1 (415) 555-0103',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'usr-emp-004',
    'employee@carbonflow.io',
    '$2a$10$e8w.b7r1Uv573kH.G8ZWeuJ3lq7w00Yk23xS05mHk82H9wK2m2kK6',
    'David Kim',
    'Facilities Operations Specialist',
    '+1 (415) 555-0104',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Organization Memberships
INSERT INTO organization_members (id, organization_id, user_id, role, status, created_at, updated_at)
VALUES
('mem-001', 'org-demo-001', 'usr-admin-001', 'COMPANY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mem-002', 'org-demo-001', 'usr-mgr-002', 'SUSTAINABILITY_MANAGER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mem-003', 'org-demo-001', 'usr-analyst-003', 'ANALYST', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mem-004', 'org-demo-001', 'usr-emp-004', 'EMPLOYEE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Emission Factors Library
INSERT INTO emission_factors (id, organization_id, category, activity_type, scope, unit, factor_value, factor_unit, source_reference, factor_year, created_at)
VALUES
('ef-001', NULL, 'Stationary Combustion', 'Natural Gas (Commercial Boiler)', 'SCOPE_1', 'therms', 0.0053, 'tCO2e/therm', 'EPA GHG Emission Factors Hub', 2024, CURRENT_TIMESTAMP),
('ef-002', NULL, 'Mobile Combustion', 'Fleet Diesel Fuel', 'SCOPE_1', 'gallons', 0.01021, 'tCO2e/gal', 'EPA GHG Emission Factors Hub', 2024, CURRENT_TIMESTAMP),
('ef-003', NULL, 'Fugitive Emissions', 'Refrigerant HFC R-410A Leakage', 'SCOPE_1', 'kg', 2.088, 'tCO2e/kg', 'IPCC AR5 GWP-100', 2024, CURRENT_TIMESTAMP),
('ef-004', NULL, 'Purchased Electricity', 'US Grid Average (eGRID subregion CAMX)', 'SCOPE_2', 'kWh', 0.000215, 'tCO2e/kWh', 'EPA eGRID 2024', 2024, CURRENT_TIMESTAMP),
('ef-005', NULL, 'Purchased Electricity', 'UK National Grid Average', 'SCOPE_2', 'kWh', 0.000207, 'tCO2e/kWh', 'UK DEFRA / DESNZ', 2024, CURRENT_TIMESTAMP),
('ef-006', NULL, 'Business Travel', 'Commercial Air Travel (Long Haul > 3700km)', 'SCOPE_3', 'passenger-km', 0.000102, 'tCO2e/p-km', 'DEFRA / ICAO Carbon Calculator', 2024, CURRENT_TIMESTAMP),
('ef-007', NULL, 'Upstream Transport', 'Road Freight (Articulated Truck)', 'SCOPE_3', 'tonne-km', 0.000084, 'tCO2e/t-km', 'GLEC Framework 3.0', 2024, CURRENT_TIMESTAMP),
('ef-008', NULL, 'Cloud & Data Center', 'AWS us-west-2 (Oregon - Hydro Powered)', 'SCOPE_3', 'compute-hrs', 0.000012, 'tCO2e/hour', 'Cloud Carbon Footprint Methodology', 2024, CURRENT_TIMESTAMP);

-- 5. Carbon Data Records (Real calculations: activity_amount * emission_factor = calculated_emissions)
INSERT INTO carbon_data (id, organization_id, reporting_period, scope, category, activity_type, activity_amount, unit, emission_factor, calculated_emissions, source, data_owner, status, notes, created_by, created_at, updated_at)
VALUES
(
    'carb-001', 'org-demo-001', '2025-Q1', 'SCOPE_1', 'Stationary Combustion', 'Natural Gas (Commercial Boiler)',
    18450.0, 'therms', 0.0053, 97.785, 'Pacific Gas & Electric Billing Portal', 'David Kim', 'VALIDATED',
    'HQ central heating consumption for winter months Jan-Mar 2025. Verified against metered utility invoice.',
    'usr-mgr-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'carb-002', 'org-demo-001', '2025-Q1', 'SCOPE_1', 'Mobile Combustion', 'Fleet Diesel Fuel',
    4200.0, 'gallons', 0.01021, 42.882, 'Fleetmatics GPS Fuel Log & Shell Fleet Cards', 'David Kim', 'VALIDATED',
    'Operations shuttle and emergency backup generator fuel delivery.',
    'usr-mgr-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'carb-003', 'org-demo-001', '2025-Q1', 'SCOPE_1', 'Fugitive Emissions', 'Refrigerant HFC R-410A Leakage',
    18.5, 'kg', 2.088, 38.628, 'Carrier HVAC Annual Preventative Service Log', 'David Kim', 'FLAGGED',
    'Chiller #2 top-up following thermal sensor recalibration. Requires secondary contractor manifest.',
    'usr-analyst-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'carb-004', 'org-demo-001', '2025-Q1', 'SCOPE_2', 'Purchased Electricity', 'US Grid Average (eGRID subregion CAMX)',
    1420500.0, 'kWh', 0.000215, 305.4075, 'San Francisco CleanPowerSF Smart Meter Feed', 'Elena Rostova', 'VALIDATED',
    'HQ Main Campus buildings A, B, and C gross electrical load.',
    'usr-analyst-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'carb-005', 'org-demo-001', '2025-Q1', 'SCOPE_2', 'Purchased Electricity', 'UK National Grid Average',
    312000.0, 'kWh', 0.000207, 64.584, 'EDF Energy UK Corporate Statement', 'Elena Rostova', 'VALIDATED',
    'London regional engineering lab and customer briefing center.',
    'usr-analyst-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'carb-006', 'org-demo-001', '2025-Q1', 'SCOPE_3', 'Business Travel', 'Commercial Air Travel (Long Haul > 3700km)',
    845000.0, 'passenger-km', 0.000102, 86.19, 'Navan / Egencia Corporate Travel Extract', 'Marcus Vance', 'UNDER_REVIEW',
    'Executive and engineering inter-continental travel for global client rollouts.',
    'usr-mgr-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'carb-007', 'org-demo-001', '2025-Q1', 'SCOPE_3', 'Cloud & Data Center', 'AWS us-west-2 (Oregon - Hydro Powered)',
    4850000.0, 'compute-hrs', 0.000012, 58.20, 'AWS Customer Carbon Footprint Tool v2', 'Elena Rostova', 'VALIDATED',
    'Production Kubernetes clusters and object storage tiers.',
    'usr-analyst-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 6. Audits
INSERT INTO audits (id, organization_id, audit_name, audit_period, audit_type, scope, lead_auditor, start_date, due_date, status, description, completion_notes, created_by, created_at, updated_at)
VALUES
(
    'aud-001', 'org-demo-001', 'FY2024 - FY2025 GHG Protocol Assurance Audit', '2025-Q1',
    'GHG_PROTOCOL_INVENTORY', 'SCOPE_1_2_3', 'Marcus Vance (Lead Auditor)',
    '2025-01-15', '2025-04-30', 'IN_PROGRESS',
    'Comprehensive Scope 1, 2, and initial upstream Scope 3 inventory verification in accordance with ISO 14064-3 limited assurance criteria.',
    NULL, 'usr-admin-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'aud-002', 'org-demo-001', 'Q1 2025 Scope 1 & 2 Rapid Facilities Audit', '2025-Q1',
    'INTERNAL_ANNUAL', 'SCOPE_1_2', 'Sarah Chen',
    '2025-02-01', '2025-03-31', 'COMPLETED',
    'Internal verification of primary meter statements and fleet diesel transactions.',
    'All stationary and electricity figures cross-checked against primary utility invoices with 0% variance.',
    'usr-admin-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 7. Evidence
INSERT INTO evidence (id, organization_id, evidence_name, evidence_type, reporting_period, source, owner, upload_date, status, description, file_url, file_size_bytes, mime_type, linked_carbon_data_id, linked_audit_id, verified_by, verified_at, verification_notes, created_at, updated_at)
VALUES
(
    'evi-001', 'org-demo-001', 'PG&E Natural Gas Invoice - Jan-Mar 2025 (HQ)', 'UTILITY_STATEMENT',
    '2025-Q1', 'Pacific Gas and Electric Utility Portal', 'David Kim', CURRENT_TIMESTAMP, 'VERIFIED',
    'Certified monthly statements demonstrating 18,450 therms consumed across meter #PG-499201.',
    'https://storage.carbonflow.io/evidence/org-demo-001/PGE_Q1_2025_HQ_NaturalGas.pdf', 1425890, 'application/pdf',
    'carb-001', 'aud-001', 'usr-mgr-002', CURRENT_TIMESTAMP, 'Meter numbers and therm consumption match carbon record carb-001 exactly.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'evi-002', 'org-demo-001', 'Shell Fleet Commercial Fuel Ledger Q1 2025', 'FUEL_INVOICE',
    '2025-Q1', 'Shell Commercial Fleet Services Account #7829', 'David Kim', CURRENT_TIMESTAMP, 'VERIFIED',
    'Detailed vehicle-by-vehicle odometer and diesel volume report totaling 4,200 gallons.',
    'https://storage.carbonflow.io/evidence/org-demo-001/Shell_Diesel_Fleet_Q1_2025.pdf', 892300, 'application/pdf',
    'carb-002', 'aud-001', 'usr-mgr-002', CURRENT_TIMESTAMP, 'Verified against fuel card reconciliation statement.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'evi-003', 'org-demo-001', 'Carrier Chiller #2 Maintenance Sign-off Sheet', 'SUPPLIER_DECLARATION',
    '2025-Q1', 'Carrier Commercial Service Division', 'David Kim', CURRENT_TIMESTAMP, 'PENDING',
    'HVAC technician field report noting 18.5 kg R-410A refrigerant charge addition.',
    'https://storage.carbonflow.io/evidence/org-demo-001/Carrier_Chiller_Service_Slip_Feb2025.pdf', 450210, 'application/pdf',
    'carb-003', 'aud-001', NULL, NULL, NULL,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'evi-004', 'org-demo-001', 'CleanPowerSF Renewable Electricity Certificate (REC)', 'RENEWABLE_CERTIFICATE',
    '2025-Q1', 'City and County of San Francisco / WREGIS', 'Elena Rostova', CURRENT_TIMESTAMP, 'VERIFIED',
    'Green-e certified attribute certificates for 1,420,500 kWh purchased for campus operations.',
    'https://storage.carbonflow.io/evidence/org-demo-001/CleanPowerSF_WREGIS_REC_Q1_2025.pdf', 1890450, 'application/pdf',
    'carb-004', 'aud-001', 'usr-mgr-002', CURRENT_TIMESTAMP, 'Serial numbers validated in WREGIS tracking system.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 8. Audit Carbon Linkages & Validations
INSERT INTO audit_carbon_data (id, audit_id, carbon_data_id, status, reviewer_id, reviewer_comments, reviewed_at)
VALUES
('ac-001', 'aud-001', 'carb-001', 'VALIDATED', 'usr-mgr-002', 'Conforms to GHG Protocol Corporate Standard Chapter 3.', CURRENT_TIMESTAMP),
('ac-002', 'aud-001', 'carb-002', 'VALIDATED', 'usr-mgr-002', 'Cross-referenced with GPS fleet mileage logs.', CURRENT_TIMESTAMP),
('ac-003', 'aud-001', 'carb-003', 'NEEDS_REVIEW', 'usr-mgr-002', 'Contractor technician certification slip missing EPA Section 608 license number.', CURRENT_TIMESTAMP),
('ac-004', 'aud-001', 'carb-004', 'VALIDATED', 'usr-mgr-002', 'Market-based and location-based factors corroborated.', CURRENT_TIMESTAMP),
('ac-005', 'aud-001', 'carb-006', 'PENDING', NULL, NULL, NULL);

-- 9. Findings
INSERT INTO findings (id, organization_id, audit_id, title, description, severity, source, related_carbon_data_id, related_evidence_id, owner_id, status, due_date, created_at, updated_at)
VALUES
(
    'fnd-001', 'org-demo-001', 'aud-001',
    'Uncertified Contractor Sign-off on R-410A Refrigerant Recharge',
    'Technician service record for chiller #2 does not provide EPA 608 Universal Technician certification or recovery cylinder tare weight documentation.',
    'MEDIUM', 'Carrier Field Service Slip review', 'carb-003', 'evi-003', 'usr-emp-004', 'OPEN',
    '2025-04-15', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'fnd-002', 'org-demo-001', 'aud-001',
    'Missing Granular Distance Breakdown in Q1 Flight Mileage Extract',
    'Approximately 14% of international flight legs were aggregated as flat route estimates without haul-class radiative forcing multipliers.',
    'LOW', 'Travel Agency Navan CSV Audit', 'carb-006', NULL, 'usr-analyst-003', 'IN_PROGRESS',
    '2025-05-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 10. Corrective Actions
INSERT INTO corrective_actions (id, organization_id, finding_id, action_title, description, owner_id, priority, due_date, status, completion_notes, created_at, updated_at)
VALUES
(
    'ca-001', 'org-demo-001', 'fnd-001',
    'Obtain Certified EPA 608 Contractor Attestation and Scale Tare Slip',
    'Contact Carrier Facilities Account Manager to retrieve certified technician license copy and formal refrigerant balance sheet.',
    'usr-emp-004', 'HIGH', '2025-04-10', 'IN_PROGRESS',
    'Contacted Carrier dispatch on April 2nd; formal EPA certificate requested and tracking under ticket #CAR-9921.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'ca-002', 'org-demo-001', 'fnd-002',
    'Implement DEFRA Flight Haul Radiative Forcing Calculator Script',
    'Re-process raw IATA airport pairs using DEFRA 2024 distance banding (domestic, short-haul, long-haul, premium economy factor adjustments).',
    'usr-analyst-003', 'MEDIUM', '2025-04-20', 'OPEN',
    NULL,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 11. Compliance Requirements Tracking
INSERT INTO compliance_requirements (id, organization_id, requirement_code, framework, requirement_name, description, applicability, owner_id, status, due_date, linked_evidence_id, linked_audit_id, notes, created_at, updated_at)
VALUES
(
    'comp-001', 'org-demo-001', 'GHG-CH4', 'GHG_PROTOCOL',
    'Scope 1 Direct Stationary & Mobile Fuel Accounting',
    'Must quantify all direct greenhouse gas emissions from combustion in owned or controlled boilers, furnaces, and vehicles.',
    'MANDATORY', 'usr-mgr-002', 'COMPLIANT', '2025-06-30', 'evi-001', 'aud-001',
    'Complete primary invoice matching in place for 100% of owned facilities.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'comp-002', 'org-demo-001', 'GHG-CH6', 'GHG_PROTOCOL',
    'Scope 2 Dual-Reporting: Location-Based and Market-Based Methods',
    'Must report electricity emissions using both location-based grid averages and market-based contractual instrument adjustments.',
    'MANDATORY', 'usr-analyst-003', 'COMPLIANT', '2025-06-30', 'evi-004', 'aud-001',
    'Both eGRID and CleanPowerSF REC attributes logged and validated.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'comp-003', 'org-demo-001', 'ESRS-E1-6', 'CSRD_ESRS_E1',
    'Gross Scopes 1, 2, 3 and Total GHG Emissions Disclosures',
    'European Corporate Sustainability Due Diligence directive requiring third-party verified emissions inventories with full audit trail.',
    'MANDATORY', 'usr-admin-001', 'PARTIALLY_COMPLIANT', '2025-12-31', NULL, 'aud-001',
    'Scope 1 and 2 compliant; Scope 3 categories 1-6 currently in validation phase.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'comp-004', 'org-demo-001', 'ISO-14064-1', 'ISO_14064_1',
    'Specification with Guidance at the Organization Level for Quantification',
    'International standard for organization-level quantification and reporting of greenhouse gas emissions and removals.',
    'VOLUNTARY', 'usr-mgr-002', 'IN_PROGRESS', '2025-10-15', NULL, 'aud-001',
    'Formal verification statement scheduled with external assurance partner for Q3.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 12. Notifications
INSERT INTO notifications (id, organization_id, user_id, title, message, type, reference_entity_type, reference_entity_id, is_read, created_at)
VALUES
(
    'notif-001', 'org-demo-001', 'usr-emp-004',
    'Corrective Action Due in 3 Days',
    'Corrective Action "Obtain Certified EPA 608 Contractor Attestation" is due on 2025-04-10.',
    'CORRECTIVE_ACTION_DUE', 'CORRECTIVE_ACTION', 'ca-001', FALSE, CURRENT_TIMESTAMP
),
(
    'notif-002', 'org-demo-001', 'usr-mgr-002',
    'Evidence Verification Required',
    'New maintenance sign-off evidence uploaded for Chiller #2 requires supervisory sign-off.',
    'EVIDENCE_REVIEW', 'EVIDENCE', 'evi-003', FALSE, CURRENT_TIMESTAMP
),
(
    'notif-003', 'org-demo-001', 'usr-analyst-003',
    'Finding Assigned',
    'Finding "Missing Granular Distance Breakdown in Q1 Flight Mileage Extract" assigned to you.',
    'FINDING_ASSIGNED', 'FINDING', 'fnd-002', TRUE, CURRENT_TIMESTAMP
);

-- 13. Audit Trail (Immutable history)
INSERT INTO audit_logs (id, organization_id, actor_id, actor_name, actor_email, action, entity_type, entity_id, metadata, ip_address, created_at)
VALUES
(
    'log-001', 'org-demo-001', 'usr-admin-001', 'Sarah Chen', 'admin@carbonflow.io',
    'CREATE', 'ORGANIZATION', 'org-demo-001', '{"name":"CarbonFlow Technologies Inc.","reporting_period":"2025"}',
    '192.168.1.10', CURRENT_TIMESTAMP
),
(
    'log-002', 'org-demo-001', 'usr-mgr-002', 'Marcus Vance', 'sustainability@carbonflow.io',
    'CREATE', 'AUDIT', 'aud-001', '{"audit_name":"FY2024 - FY2025 GHG Protocol Assurance Audit","scope":"SCOPE_1_2_3"}',
    '192.168.1.15', CURRENT_TIMESTAMP
),
(
    'log-003', 'org-demo-001', 'usr-mgr-002', 'Marcus Vance', 'sustainability@carbonflow.io',
    'EVIDENCE_VERIFY', 'EVIDENCE', 'evi-001', '{"status":"VERIFIED","verified_by":"Marcus Vance"}',
    '192.168.1.15', CURRENT_TIMESTAMP
),
(
    'log-004', 'org-demo-001', 'usr-mgr-002', 'Marcus Vance', 'sustainability@carbonflow.io',
    'CREATE', 'FINDING', 'fnd-001', '{"severity":"MEDIUM","title":"Uncertified Contractor Sign-off on R-410A Refrigerant Recharge"}',
    '192.168.1.15', CURRENT_TIMESTAMP
),
(
    'log-005', 'org-demo-001', 'usr-admin-001', 'Sarah Chen', 'admin@carbonflow.io',
    'CREATE', 'CORRECTIVE_ACTION', 'ca-001', '{"priority":"HIGH","action_title":"Obtain Certified EPA 608 Contractor Attestation"}',
    '192.168.1.10', CURRENT_TIMESTAMP
);
