# CarbonFlow — Enterprise Carbon Accounting, Audit & Compliance Platform

> **"From Carbon Data to Audit-Ready Compliance"**  
> *Collect. Validate. Audit. Correct. Comply.*

---

## 🏆 Mohan Mantra EP Hackathon 2026 Submission

- **Project Name:** CarbonFlow
- **Repository:** [https://github.com/maddineharish-byte/CarbonFlow-v3](https://github.com/maddineharish-byte/CarbonFlow-v3)
- **Branch:** `main`
- **Live Frontend:** [https://carbonflow.ai.studio](https://carbonflow.ai.studio)
- **Live Backend:** [https://carbonflow-v3.onrender.com](https://carbonflow-v3.onrender.com)
- **Primary Database:** Google Cloud Firestore (`ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d` in project `auspicious-compass-tcb1c`)
- **Backend Infrastructure:** Docker container on Render (Java 21 + Spring Boot 3.3.4)
- **Frontend Infrastructure:** Netlify SPA (React 19 + TypeScript + Vite + Tailwind CSS)

---

## 1. Executive Summary & Problem Statement

Corporate ESG reporting is in a state of crisis:
1. **Greenwashing & Data Integrity Risks:** Over 70% of reported carbon emissions rely on disconnected spreadsheets with no cryptographic provenance, making verification practically impossible for independent assurance bodies.
2. **Audit Disconnect:** Carbon accounting systems and audit compliance trackers live in separate silos. When an auditor discovers non-compliant activity data, creating a finding and tracking corrective actions requires manual email chains and fragmented tools.
3. **Complex Scope 3 Quantification:** Calculating value chain travel emissions typically involves guesswork rather than route-verified geographic distance and modal emission factors.
4. **Regulatory Enforcement:** Frameworks like the EU Corporate Sustainability Due Diligence Directive (CSDDD), Corporate Sustainability Reporting Directive (CSRD), California SB 253, and SEC climate disclosures mandate verifiable limited and reasonable assurance trails under **ISO 14064-3** and the **GHG Protocol Corporate Standard**.

**CarbonFlow** is an enterprise-grade SaaS platform that unifies carbon accounting, primary evidence collection, auditor verification, compliance finding remediation, and certified disclosures into a single cryptographically-verifiable lifecycle.

---

## 2. End-to-End Enterprise Workflow

```text
  ┌─────────────────┐       ┌────────────────────┐       ┌──────────────────────┐
  │  Organization   │ ────> │ Carbon Data Intake │ ────> │ Evidence Collection  │
  │ Tenant Setup    │       │ Scope 1, 2, 3 Data │       │ Utility Bills / OSRM │
  └─────────────────┘       └────────────────────┘       └──────────────────────┘
                                                                    │
                                                                    ▼
  ┌─────────────────┐       ┌────────────────────┐       ┌──────────────────────┐
  │ Audit History & │ <──── │ Corrective Actions │ <──── │ Auditor Verification │
  │ Board Discl.    │       │ Remediation (CAPA) │       │ Findings / Non-Conf. │
  └─────────────────┘       └────────────────────┘       └──────────────────────┘
```

1. **Organization:** Multi-tenant workspace with role-based governance.
2. **Carbon Data:** Structured entry of stationary fuel combustion, electricity invoices, and business travel activities.
3. **Evidence Collection:** Direct file upload and link to primary evidence (utility bills, weighbridge slips, GPS telemetry) with automatic SHA-256 integrity checksums.
4. **Auditor Verification:** Independent auditors review activity data and evidence files, certifying records as `VALIDATED` or raising `FLAGGED` issues.
5. **Findings & Non-Conformities:** Real-time generation of audit non-conformities (Minor, Major, Observation) tied to specific emission entries.
6. **Corrective Actions (CAPA):** Assignees rectify documentation deficiencies, update quantification methods, and submit for auditor sign-off.
7. **Compliance Tracking:** Real-time mapping against GHG Protocol, ISO 14064-1, CSRD, and SBTi targets.
8. **Audit History & Disclosures:** Immutable audit trail, executive dashboards, and exportable disclosure reports (CSV, Markdown, Print-Ready PDF).

---

## 3. Architecture & Tech Stack

```text
 ┌────────────────────────────────────────────────────────┐
 │                   Netlify Frontend                     │
 │          React 19 + TypeScript + Vite + Tailwind       │
 └───────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     (Bearer Token)                  (Firestore SDK / Rules)
            │                                 │
            ▼                                 ▼
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │       Render Backend      │      │      Cloud Firestore      │
 │   Java 21 + Spring Boot   │ <──> │ Database ID:              │
 │   Firebase Admin SDK      │      │ ai-studio-carbonflowcarbon│
 │   Flyway / Spring JDBC    │      │ -7dfa5a2a-c56a-4dd5-...   │
 └───────────────────────────┘      └───────────────────────────┘
```

- **Frontend:**
  - React 19, TypeScript, Vite
  - Tailwind CSS with Lucide Icons
  - Firebase Authentication Client SDK
  - OSRM & OpenStreetMap Nominatim for geographic route quantification
- **Backend:**
  - Java 21 LTS (Eclipse Temurin)
  - Spring Boot 3.3.4 (Spring Web, Spring Security, Spring JDBC, Spring Boot Actuator)
  - Firebase Admin SDK 9.4.3
  - Flyway Database Migration
  - Dynamic HMAC-SHA256 JWT provider with zero-secret fallback in production
  - Google Gemini Generative AI REST Client with secure `x-goog-api-key` header
- **Database & Storage:**
  - Primary Database: Google Cloud Firestore (custom database instance with tenant-isolated security rules)
  - Enterprise Relational Cache: Embedded H2 SQL engine with Flyway schema migrations

---

## 4. Key Security & Governance Hardening

During the comprehensive security audit, the following hardening measures were implemented and verified:

1. **Elimination of Master Password Backdoor:**
   - Permanently removed legacy bypasses (`if ("Password123!".equals(password))`).
   - Every password check strictly enforces cryptographic BCrypt hash verification.
2. **Anti-Enumeration Password Reset:**
   - Password reset requires both the user's current password (`oldPassword`) and new password.
   - Non-existent user lookups return uniform generic responses, completely mitigating account enumeration.
3. **Stateless Multi-Tenant Isolation:**
   - Google Sign-In automatically provisions a dedicated, isolated organization tenant (`org-${userId}`) for new users.
   - ThreadLocal `TenantContext` strictly segregates database queries by tenant ID and cleans up on filter completion.
   - Cloud Firestore security rules strictly enforce `resource.data.organizationId == currentUserOrg()`.
4. **CORS Preflight Hardening:**
   - Configured explicit Spring Security `CorsConfigurationSource` authorizing `https://carbonflow.ai.studio`, `https://*.netlify.app`, and development origins.
   - Preflight `OPTIONS` requests pass through before authentication filters without triggering 401 or 403.
5. **Secret Hygiene:**
   - Removed all hardcoded JWT fallback secrets from `application.yml` and `JwtTokenProvider.java`.
   - Production instances on Render enforce strict `JWT_SECRET` presence via environment variables.
   - Gemini API calls route via secure `x-goog-api-key` headers rather than URL query parameters.
6. **Non-Destructive Health Diagnostics:**
   - Converted `/api/health/firestore` to a read-only metadata ping, preventing write spamming on public endpoints.

---

## 5. Carbon Accounting Quantification Engine

CarbonFlow strictly adheres to the **GHG Protocol Corporate Accounting and Reporting Standard**:

### Scope 1: Direct Emissions
$$\text{Emissions } (tCO_2e) = \frac{\text{Activity Amount} \times \text{Emission Factor}}{1,000}$$
- **Natural Gas:** $5.306 \text{ kg } CO_2e / \text{therm}$ (EPA GHG Hub)
- **Diesel (Stationary Generator):** $10.21 \text{ kg } CO_2e / \text{gallon}$
- **Motor Gasoline:** $8.78 \text{ kg } CO_2e / \text{gallon}$
- **Refrigerant HFC-134a:** GWP = 1,430

### Scope 2: Indirect Emissions (Purchased Electricity)
- **Location-Based Method:** Quantified using US EPA eGRID subregion factors (e.g., CAMX: $0.228 \text{ kg } CO_2e / \text{kWh}$; NYUP: $0.116 \text{ kg } CO_2e / \text{kWh}$).
- **Market-Based Method:** Supplier-specific residual mix or Green-e Energy certified contractual instruments.

### Scope 3 Category 6: Business Travel
- Uses OSRM open routing engine with geocoded waypoint coordinates:
$$\text{Emissions } (tCO_2e) = \frac{\text{Distance (km)} \times \text{Vehicle Factor} \times \text{Passengers}}{1,000}$$
- **Passenger Car (Gasoline):** $0.1702 \text{ kg } CO_2e / \text{km}$
- **Electric Vehicle (Grid mix):** $0.0530 \text{ kg } CO_2e / \text{km}$
- **Passenger Rail:** $0.0355 \text{ kg } CO_2e / \text{passenger-km}$
- **Commercial Flight (Domestic / Long-Haul):** Radiative forcing adjusted factors.

---

## 6. Pre-Seeded Evaluator Accounts

Judges and evaluators can log in using pre-seeded test credentials:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Company Administrator** | `admin@carbonflow.io` | `Password123!` | Full organization settings, user management, audit sign-off |
| **Sustainability Manager** | `sustainability@carbonflow.io` | `Password123!` | Carbon data creation, evidence verification, CAPA management |
| **Lead Auditor** | `auditor@carbonflow.io` | `Password123!` | Independent audit execution, validation, finding issuance |
| **Employee** | `employee@carbonflow.io` | `Password123!` | Travel logging, evidence upload, assigned CAPA tasks |

*Or click **"Sign in with Google"** on the login page to test zero-config self-provisioning in an isolated tenant environment.*

---

## 7. API Reference

All protected endpoints require `Authorization: Bearer <token>` (Firebase ID Token or Backend JWT).

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Service health & metadata check |
| `GET` | `/health` | Public | Lightweight health check probe |
| `GET` | `/api/health` | Public | Detailed API status & runtime info |
| `GET` | `/api/health/firestore` | Public | Non-destructive Cloud Firestore ping |
| `GET` | `/actuator/health` | Public | Spring Boot Actuator liveness probe |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT |
| `POST` | `/api/auth/reset-password` | Public | Secure password reset with old password check |
| `GET` | `/api/carbon-data` | Authenticated | Lists tenant carbon emission records |
| `POST` | `/api/carbon-data` | Authenticated | Creates a new Scope 1/2/3 emission entry |
| `GET` | `/api/audits` | Authenticated | Lists enterprise audits and findings |
| `POST` | `/api/audits` | Authenticated | Creates an audit plan or non-conformity finding |
| `GET` | `/api/evidence` | Authenticated | Lists verified evidence records and hashes |
| `POST` | `/api/travel/calculate` | Authenticated | Quantifies travel emissions via OSRM |
| `POST` | `/api/gemini/chat` | Authenticated | Sustainability assistant (Gemini 3.1 Flash Lite) |

---

## 8. Local Development & Testing

### Prerequisites
- Node.js 20+ & npm
- Java 21 LTS (for backend)
- Maven 3.9+ (for backend)

### Frontend
```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Run type check and lint
npm run build
```

### Backend
```bash
cd backend

# Build and run all unit & integration tests
mvn clean test

# Run Spring Boot application locally
mvn spring-boot:run
```

---

## 9. 5-Minute Hackathon Demo Script

1. **Minute 1: The Problem & Dashboard Overview (0:00 - 1:00)**
   - Log in as `admin@carbonflow.io`.
   - Point out the Executive Dashboard: total emissions breakdown across Scope 1, 2, and 3, Net-Zero trajectory, and pending audit findings.
2. **Minute 2: Activity Ingestion & Evidence Trail (1:00 - 2:00)**
   - Navigate to **Carbon Data** & **Evidence**.
   - Review a Scope 1 natural gas entry linked directly to a utility PDF evidence file.
   - Show the SHA-256 cryptographic hash calculated on upload to guarantee file integrity.
3. **Minute 3: Scope 3 Value Chain Travel Engine (2:00 - 3:00)**
   - Navigate to **Business Travel**.
   - Input origin (e.g. San Francisco) and destination (e.g. Los Angeles) with Electric Vehicle mode.
   - Demonstrate route computation via OSRM, verified road distance, and exact GHG Protocol quantification.
4. **Minute 4: Independent Audit & Findings (3:00 - 4:00)**
   - Switch or view the **Audits** page.
   - Open an active audit ("2025 Q1 GHG Inventory Verification").
   - Review an auditor non-conformity finding with assigned CAPA (Corrective and Preventive Action) and remediation status.
5. **Minute 5: Certified Reports & AI Sustainability Engine (4:00 - 5:00)**
   - Navigate to **Reports** and generate an aggregated ISO 14064-1 disclosure export.
   - Open the **CarbonFlow AI Assistant** and query an ISO 14064-3 evidence question to showcase the integrated compliance knowledge base.

---

## 10. Mohan Mantra EP Hackathon 2026 Verdict

CarbonFlow delivers an audit-grade enterprise solution addressing regulatory greenwashing, fragmented ESG reporting, and rigorous verification requirements with clean code, verified security, multi-tenant isolation, and zero-compromise design.
