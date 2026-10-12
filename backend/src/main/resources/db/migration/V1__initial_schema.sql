-- V1__initial_schema.sql
-- CarbonFlow Relational Database Schema
-- Compatible with PostgreSQL and H2 (standard SQL-92/99)

-- 1. Organizations Base Table
CREATE TABLE organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    reporting_period VARCHAR(50) DEFAULT '2025',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 2. Users Base Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(150),
    phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 3. Roles Base Table
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Seed standard system roles into roles table
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
('role-company-admin', 'COMPANY_ADMIN', 'Organization administrator with full governance and security privileges', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-sustainability-mgr', 'SUSTAINABILITY_MANAGER', 'Lead manager for emissions auditing, reviews, and compliance certifications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-analyst', 'ANALYST', 'Carbon accounting analyst managing activity ledgers, factors, and audit reviews', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-employee', 'EMPLOYEE', 'Operational team member submitting localized activity data and evidence', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Organization Members Junction Table
CREATE TABLE organization_members (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(36) REFERENCES roles(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL REFERENCES roles(name) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

-- 5. Emission Factors Library Table
CREATE TABLE emission_factors (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    activity_type VARCHAR(150) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    factor_value DOUBLE PRECISION NOT NULL,
    factor_unit VARCHAR(50) NOT NULL,
    source_reference VARCHAR(255) NOT NULL,
    factor_year INT NOT NULL DEFAULT 2024,
    created_at TIMESTAMP NOT NULL
);

-- 6. Carbon Activity Ledger Table
CREATE TABLE carbon_data (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reporting_period VARCHAR(50) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    activity_type VARCHAR(150) NOT NULL,
    activity_amount DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL,
    emission_factor DOUBLE PRECISION NOT NULL,
    calculated_emissions DOUBLE PRECISION NOT NULL,
    source VARCHAR(255) NOT NULL,
    data_owner VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 7. Audits Management Table
CREATE TABLE audits (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_name VARCHAR(255) NOT NULL,
    audit_period VARCHAR(50) NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    lead_auditor VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    completion_notes TEXT,
    closed_at TIMESTAMP,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 8. Evidence Digital Vault Table
CREATE TABLE evidence (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_name VARCHAR(255) NOT NULL,
    evidence_type VARCHAR(100) NOT NULL,
    reporting_period VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL,
    owner VARCHAR(150) NOT NULL,
    upload_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    file_url VARCHAR(500),
    file_size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    linked_carbon_data_id VARCHAR(36) REFERENCES carbon_data(id) ON DELETE SET NULL,
    linked_audit_id VARCHAR(36) REFERENCES audits(id) ON DELETE SET NULL,
    verified_by VARCHAR(36) REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 9. Audit to Carbon Data Review Junction Table
CREATE TABLE audit_carbon_data (
    id VARCHAR(36) PRIMARY KEY,
    audit_id VARCHAR(36) NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    carbon_data_id VARCHAR(36) NOT NULL REFERENCES carbon_data(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reviewer_id VARCHAR(36) REFERENCES users(id),
    reviewer_comments TEXT,
    reviewed_at TIMESTAMP,
    CONSTRAINT uq_audit_carbon UNIQUE (audit_id, carbon_data_id)
);

-- 10. Audit Findings & Non-Conformances Table
CREATE TABLE findings (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_id VARCHAR(36) NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL,
    related_carbon_data_id VARCHAR(36) REFERENCES carbon_data(id) ON DELETE SET NULL,
    related_evidence_id VARCHAR(36) REFERENCES evidence(id) ON DELETE SET NULL,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    due_date DATE NOT NULL,
    resolution_date TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 11. Corrective Actions (CAPA) Table
CREATE TABLE corrective_actions (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    finding_id VARCHAR(36) NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    action_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id),
    priority VARCHAR(50) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    completion_date TIMESTAMP,
    completion_notes TEXT,
    completion_evidence_id VARCHAR(36) REFERENCES evidence(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 12. Regulatory Compliance Tracking Table
CREATE TABLE compliance_requirements (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requirement_code VARCHAR(100) NOT NULL,
    framework VARCHAR(100) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    applicability VARCHAR(100) NOT NULL,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    due_date DATE,
    linked_evidence_id VARCHAR(36) REFERENCES evidence(id) ON DELETE SET NULL,
    linked_audit_id VARCHAR(36) REFERENCES audits(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 13. System Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_entity_type VARCHAR(50),
    reference_entity_id VARCHAR(36),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

-- 14. Append-Only Audit Trail Table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id VARCHAR(36) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    metadata TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL
);

-- Performance and Multi-Tenant Isolation Indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_carbon_org ON carbon_data(organization_id);
CREATE INDEX idx_carbon_period ON carbon_data(reporting_period);
CREATE INDEX idx_carbon_scope ON carbon_data(scope);
CREATE INDEX idx_evidence_org ON evidence(organization_id);
CREATE INDEX idx_audits_org ON audits(organization_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_findings_org ON findings(organization_id);
CREATE INDEX idx_findings_audit ON findings(audit_id);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_actions_org ON corrective_actions(organization_id);
CREATE INDEX idx_actions_finding ON corrective_actions(finding_id);
CREATE INDEX idx_compliance_org ON compliance_requirements(organization_id);
CREATE INDEX idx_auditlogs_org ON audit_logs(organization_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
