import React, { useState } from 'react';
import {
  Code2,
  Database,
  FileCode,
  Terminal,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';

export function DocumentationPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const schemaSnippet = `-- V1__initial_schema.sql (Excerpt)
CREATE TABLE organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    reporting_period VARCHAR(50) DEFAULT '2025',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

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
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);`;

  const endpointsSnippet = `// REST API Summary
GET    /api/auth/demo-accounts      // List preconfigured evaluation logins
POST   /api/auth/login              // Generate JWT session token
POST   /api/auth/register           // Provision new organization & admin

GET    /api/organizations/current   // Retrieve tenant details
PUT    /api/organizations/current   // Update organization (Admin only)

GET    /api/carbon-data             // List & search records with scope filter
POST   /api/carbon-data             // Create carbon activity with factor math
PUT    /api/carbon-data/{id}        // Edit activity record
DELETE /api/carbon-data/{id}        // Delete activity (Admin & Manager)

GET    /api/evidence                // Search uploaded audit files
POST   /api/evidence                // Ingest utility invoice or fuel bill
PATCH  /api/evidence/{id}/verify    // Sign-off verification verdict

GET    /api/audits                  // Audit pipeline status
POST   /api/audits                  // Create audit engagement
POST   /api/audits/{id}/validate/{carbId} // Record line-item verification

GET    /api/findings                // Track audit non-conformances
GET    /api/corrective-actions      // CAPA assignments and due dates
GET    /api/compliance              // Cross-framework readiness scorecard
GET    /api/reports/dashboard       // Real SQL aggregated metrics
GET    /api/reports/export/carbon-csv // Download raw CSV ledger
GET    /api/audit-logs              // Append-only event trail`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Developer & Architect Guide</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          System Documentation
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Complete database specifications, Flyway schema migration definitions, and REST API contracts for CarbonFlow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Flyway Schema Section */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Database className="h-4 w-4 text-emerald-700" />
                Flyway Relational SQL Schema
              </div>
              <button
                onClick={() => handleCopy(schemaSnippet, 'schema')}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
              >
                {copiedSection === 'schema' ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSection === 'schema' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="mt-4 max-h-96 overflow-x-auto rounded-lg bg-stone-900 p-4 font-mono text-[11px] text-stone-200 leading-relaxed">
              {schemaSnippet}
            </pre>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            Stored in <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">backend/src/main/resources/db/migration/</code>. Executed automatically during Spring Boot startup.
          </p>
        </div>

        {/* REST API Endpoints */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Terminal className="h-4 w-4 text-emerald-700" />
                RESTful API Specification
              </div>
              <button
                onClick={() => handleCopy(endpointsSnippet, 'api')}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
              >
                {copiedSection === 'api' ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSection === 'api' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="mt-4 max-h-96 overflow-x-auto rounded-lg bg-stone-900 p-4 font-mono text-[11px] text-stone-200 leading-relaxed">
              {endpointsSnippet}
            </pre>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            Authoritative Java controllers with standardized JSON responses (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">success, message, code, data, timestamp</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
