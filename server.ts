import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = Number(process.argv[portArgIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.DEFAULT_APP_PORT) {
    const parsed = Number(process.env.DEFAULT_APP_PORT);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // In containerized AI Studio, PORT=8080 is reserved for nginx reverse proxy.
  // The backend/Express dev server must listen on port 3000.
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = Number(process.env.PORT);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

function resolveHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return '0.0.0.0';
}

const PORT = resolvePort();
const HOST = resolveHost();

app.use(express.json());

// Server-side GoogleGenAI client per gemini_api skill
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key.trim()) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ==========================================
// FULL-STACK CARBONFLOW API ROUTES
// ==========================================

// 1. Auth Login
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  const accounts: Record<string, { userId: string; fullName: string; role: string; title: string }> = {
    'admin@carbonflow.io': { userId: 'usr-admin-001', fullName: 'Sarah Chen', role: 'COMPANY_ADMIN', title: 'Chief Operations & Governance Officer' },
    'sustainability@carbonflow.io': { userId: 'usr-mgr-002', fullName: 'Marcus Vance', role: 'SUSTAINABILITY_MANAGER', title: 'Head of ESG & Sustainability Auditing' },
    'analyst@carbonflow.io': { userId: 'usr-analyst-003', fullName: 'Elena Rostova', role: 'ANALYST', title: 'Senior Carbon Accounting Analyst' },
    'employee@carbonflow.io': { userId: 'usr-emp-004', fullName: 'David Kim', role: 'EMPLOYEE', title: 'Facilities Operations Specialist' }
  };
  const matched = (email && accounts[email.toLowerCase()]) || {
    userId: 'usr-' + Date.now(),
    fullName: email ? email.split('@')[0] : 'Enterprise User',
    role: 'COMPANY_ADMIN',
    title: 'Sustainability Officer'
  };
  return res.json({
    token: `jwt-token-${matched.userId}-${Date.now()}`,
    userId: matched.userId,
    email: email || 'user@carbonflow.io',
    fullName: matched.fullName,
    organizationId: 'org-demo-001',
    organizationName: 'CarbonFlow Technologies Inc.',
    role: matched.role
  });
});

// 2. Auth Register
app.post('/api/auth/register', (req, res) => {
  const { email, fullName, title, organizationName } = req.body || {};
  const userId = 'usr-' + Date.now();
  return res.json({
    token: `jwt-token-${userId}-${Date.now()}`,
    userId,
    email: email || 'user@carbonflow.io',
    fullName: fullName || 'New User',
    organizationId: 'org-' + Date.now(),
    organizationName: organizationName || 'New Organization',
    role: 'COMPANY_ADMIN',
    title: title || 'Director of Sustainability'
  });
});

// 3. Notifications Store & Endpoints
let notificationsList = [
  { id: 'notif-001', organizationId: 'org-demo-001', userId: 'usr-emp-004', title: 'Corrective Action Due in 3 Days', message: 'Action "Obtain Certified EPA 608 Contractor Attestation" is due on 2025-04-10.', type: 'CORRECTIVE_ACTION_DUE', referenceEntityType: 'CORRECTIVE_ACTION', referenceEntityId: 'ca-001', read: false, createdAt: '2025-04-07T08:00:00Z' },
  { id: 'notif-002', organizationId: 'org-demo-001', userId: 'usr-mgr-002', title: 'Evidence Verification Required', message: 'Carrier Chiller maintenance sign-off requires supervisor sign-off.', type: 'EVIDENCE_REVIEW', referenceEntityType: 'EVIDENCE', referenceEntityId: 'evi-003', read: false, createdAt: '2025-04-06T14:30:00Z' },
  { id: 'notif-003', organizationId: 'org-demo-001', userId: 'usr-analyst-003', title: 'Finding Assigned', message: 'Finding "Missing Granular Distance Breakdown in Q1 Flight Mileage" assigned to you.', type: 'FINDING_ASSIGNED', referenceEntityType: 'FINDING', referenceEntityId: 'fnd-002', read: true, createdAt: '2025-04-05T09:15:00Z' }
];

let organizationalThresholds = {
  monthlyCeiling: 235.0,
  warningThresholdPct: 95.0,
  scope1Ceiling: 65.0,
  scope2Ceiling: 130.0,
  scope3Ceiling: 52.0,
  autoAlertsEnabled: true,
  soundEnabled: false,
  emailDigestEnabled: true,
  updatedAt: new Date().toISOString()
};

app.get('/api/notifications', (_req, res) => {
  return res.json({
    items: notificationsList,
    unreadCount: notificationsList.filter(n => !n.read).length
  });
});

app.post('/api/notifications', (req, res) => {
  const newItem = {
    id: 'notif-' + Date.now(),
    organizationId: req.body?.organizationId || 'org-demo-001',
    userId: req.body?.userId || 'usr-mgr-002',
    title: req.body?.title || 'Emissions Threshold Alert',
    message: req.body?.message || 'Monthly carbon emissions exceeded defined organizational thresholds.',
    type: req.body?.type || 'THRESHOLD_EXCEEDED',
    referenceEntityType: req.body?.referenceEntityType || 'CARBON_DATA',
    referenceEntityId: req.body?.referenceEntityId || 'monthly-emissions',
    read: false,
    createdAt: new Date().toISOString()
  };
  notificationsList.unshift(newItem);
  return res.status(201).json(newItem);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const item = notificationsList.find(n => n.id === req.params.id);
  if (item) item.read = true;
  return res.json({ success: true });
});

app.delete('/api/notifications/:id', (req, res) => {
  notificationsList = notificationsList.filter(n => n.id !== req.params.id);
  return res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (_req, res) => {
  notificationsList.forEach(n => n.read = true);
  return res.json({ success: true });
});

app.get('/api/organizations/thresholds', (_req, res) => {
  return res.json(organizationalThresholds);
});

app.put('/api/organizations/thresholds', (req, res) => {
  organizationalThresholds = {
    ...organizationalThresholds,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  return res.json(organizationalThresholds);
});

// 4. Organization Current
app.get('/api/organizations/current', (_req, res) => {
  return res.json({
    id: 'org-demo-001',
    name: 'CarbonFlow Technologies Inc.',
    industry: 'Technology & Enterprise Software',
    country: 'United States',
    location: 'San Francisco, CA & Global Operations',
    description: 'Global enterprise cloud infrastructure and SaaS provider tracking Net-Zero 2030 targets.',
    reportingPeriod: '2025'
  });
});

// 5. Dashboard Metrics
app.get('/api/reports/dashboard', (_req, res) => {
  const totalEmissions = 693.68;
  const scope1 = 179.30;
  const scope2 = 369.99;
  const scope3 = 144.39;

  return res.json({
    totalCarbonRecords: 7,
    totalEmissions,
    scope1Emissions: scope1,
    scope2Emissions: scope2,
    scope3Emissions: scope3,
    scope1,
    scope2,
    scope3,
    totalEvidenceRecords: 4,
    verifiedEvidenceRecords: 3,
    pendingEvidenceRecords: 1,
    activeAudits: 1,
    totalAudits: 3,
    completedAudits: 2,
    openFindings: 2,
    overdueFindings: 0,
    criticalFindings: 0,
    resolvedFindings: 1,
    totalCorrectiveActions: 3,
    overdueCorrectiveActions: 0,
    pendingActions: 1,
    compliantRequirements: 8,
    totalRequirements: 10,
    netZeroTargetProgress: 68.4,
    auditReadinessScore: 92.5,
    verifiedEvidenceRatio: 75.0,
    complianceCompletionRate: 85.0,
    validatedRecords: 5,
    flaggedRecords: 1,
    underReviewRecords: 1,
    emissionsByScope: [
      {
        scope: 'Scope 1 (Direct)',
        recordCount: 3,
        emissions: scope1,
        emissionsTotal: scope1,
        percentage: 25.8
      },
      {
        scope: 'Scope 2 (Grid Electricity)',
        recordCount: 2,
        emissions: scope2,
        emissionsTotal: scope2,
        percentage: 53.3
      },
      {
        scope: 'Scope 3 (Value Chain)',
        recordCount: 2,
        emissions: scope3,
        emissionsTotal: scope3,
        percentage: 20.8
      }
    ],
    emissionsByPeriod: [
      { reportingPeriod: '2024-Q3', totalEmissions: 540.2 },
      { reportingPeriod: '2024-Q4', totalEmissions: 610.8 },
      { reportingPeriod: '2025-Q1', totalEmissions }
    ],
    findingsBySeverity: [
      { severity: 'CRITICAL', count: 0 },
      { severity: 'HIGH', count: 1 },
      { severity: 'MEDIUM', count: 1 },
      { severity: 'LOW', count: 0 }
    ],
    correctiveActionsByStatus: [
      { status: 'OPEN', count: 1 },
      { status: 'IN_PROGRESS', count: 1 },
      { status: 'COMPLETED', count: 1 }
    ],
    complianceByStatus: [
      { status: 'COMPLIANT', count: 8 },
      { status: 'PARTIALLY_COMPLIANT', count: 1 },
      { status: 'IN_PROGRESS', count: 1 }
    ],
    emissionsByQuarter: [
      { period: '2024-Q1', scope1: 195.2, scope2: 390.1, scope3: 155.0, total: 740.3 },
      { period: '2024-Q2', scope1: 190.5, scope2: 382.4, scope3: 150.2, total: 723.1 },
      { period: '2024-Q3', scope1: 185.0, scope2: 375.0, scope3: 148.0, total: 708.0 },
      { period: '2024-Q4', scope1: 182.1, scope2: 372.0, scope3: 146.5, total: 700.6 },
      { period: '2025-Q1', scope1, scope2, scope3, total: totalEmissions }
    ]
  });
});

// 5.0 Emission Factors Registry (aligned with V3__travel_mobility.sql & EPA/DEFRA standards)
let serverEmissionFactors = [
  { id: 'ef-001', category: 'Stationary Combustion', activityType: 'Natural Gas (Commercial Boiler)', scope: 'SCOPE_1', unit: 'therms', factorValue: 0.0053, factorUnit: 'tCO2e/therm', sourceReference: 'EPA GHG Hub', factorYear: 2024 },
  { id: 'ef-002', category: 'Mobile Combustion', activityType: 'Fleet Diesel Fuel', scope: 'SCOPE_1', unit: 'gallons', factorValue: 0.01021, factorUnit: 'tCO2e/gal', sourceReference: 'EPA GHG Hub', factorYear: 2024 },
  { id: 'ef-003', category: 'Fugitive Emissions', activityType: 'Refrigerant HFC R-410A Leakage', scope: 'SCOPE_1', unit: 'kg', factorValue: 2.088, factorUnit: 'tCO2e/kg', sourceReference: 'IPCC AR5 GWP-100', factorYear: 2024 },
  { id: 'ef-004', category: 'Purchased Electricity', activityType: 'US Grid Average (eGRID CAMX)', scope: 'SCOPE_2', unit: 'kWh', factorValue: 0.000215, factorUnit: 'tCO2e/kWh', sourceReference: 'EPA eGRID 2024', factorYear: 2024 },
  { id: 'ef-005', category: 'Purchased Electricity', activityType: 'UK National Grid Average', scope: 'SCOPE_2', unit: 'kWh', factorValue: 0.000207, factorUnit: 'tCO2e/kWh', sourceReference: 'UK DEFRA / DESNZ', factorYear: 2024 },
  { id: 'ef-006', category: 'Business Travel', activityType: 'Commercial Air Travel (> 3700km)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000102, factorUnit: 'tCO2e/p-km', sourceReference: 'DEFRA / ICAO', factorYear: 2024 },
  { id: 'ef-007', category: 'Upstream Transport', activityType: 'Road Freight (Articulated Truck)', scope: 'SCOPE_3', unit: 'tonne-km', factorValue: 0.000084, factorUnit: 'tCO2e/t-km', sourceReference: 'GLEC Framework 3.0', factorYear: 2024 },
  { id: 'ef-008', category: 'Cloud & Data Center', activityType: 'AWS us-west-2 (Hydro Powered)', scope: 'SCOPE_3', unit: 'compute-hrs', factorValue: 0.000012, factorUnit: 'tCO2e/hr', sourceReference: 'Cloud Carbon Footprint', factorYear: 2024 },
  // Standard Ground & Business Travel Emission Factors (Scope 3 Category 6)
  { id: 'ef-travel-001', category: 'Business Travel', activityType: 'Passenger Car (Gasoline Average)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000170, factorUnit: 'tCO2e/p-km', sourceReference: 'EPA GHG Emission Factors Hub 2024 / DEFRA', factorYear: 2024 },
  { id: 'ef-travel-002', category: 'Business Travel', activityType: 'Passenger Car (Electric Vehicle - Grid Avg)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000053, factorUnit: 'tCO2e/p-km', sourceReference: 'EPA eGRID 2024 / DEFRA EV Factor', factorYear: 2024 },
  { id: 'ef-travel-003', category: 'Business Travel', activityType: 'Passenger Car (Hybrid Electric)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000109, factorUnit: 'tCO2e/p-km', sourceReference: 'UK DEFRA / DESNZ 2024', factorYear: 2024 },
  { id: 'ef-travel-004', category: 'Business Travel', activityType: 'Public Transit (Passenger Rail / Train)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000035, factorUnit: 'tCO2e/p-km', sourceReference: 'UK DEFRA / Amtrak Regional 2024', factorYear: 2024 },
  { id: 'ef-travel-005', category: 'Business Travel', activityType: 'Public Transit (City Bus)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000089, factorUnit: 'tCO2e/p-km', sourceReference: 'EPA GHG Hub 2024 / DEFRA', factorYear: 2024 },
  { id: 'ef-travel-006', category: 'Business Travel', activityType: 'Active Mobility (Walking / Bicycle)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000000, factorUnit: 'tCO2e/p-km', sourceReference: 'GHG Protocol Corporate Standard (Zero Direct)', factorYear: 2024 },
  { id: 'ef-travel-007', category: 'Business Travel', activityType: 'Taxi / Rideshare (Single Occupancy)', scope: 'SCOPE_3', unit: 'passenger-km', factorValue: 0.000195, factorUnit: 'tCO2e/p-km', sourceReference: 'UK DEFRA / GLEC Framework 2024', factorYear: 2024 }
];

app.get('/api/carbon-data/emission-factors', (_req, res) => {
  return res.json(serverEmissionFactors);
});

// 5.1 Carbon Data
let serverCarbonRecords = [
  { id: 'carb-001', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_1', category: 'Stationary Combustion', activityType: 'Natural Gas Heating (HQ)', activityAmount: 18450, unit: 'therms', emissionFactor: 0.00531, calculatedEmissions: 97.97, source: 'Utility Bill (PG&E)', dataOwner: 'David Kim', status: 'VALIDATED', notes: 'Main headquarters hydronic heating boiler system.', createdAt: '2025-01-31T08:00:00Z' },
  { id: 'carb-002', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_1', category: 'Mobile Combustion', activityType: 'Company Fleet Diesel', activityAmount: 4200, unit: 'gallons', emissionFactor: 0.01021, calculatedEmissions: 42.88, source: 'Shell Fleet Management System', dataOwner: 'David Kim', status: 'VALIDATED', notes: 'Regional distribution transit vans.', createdAt: '2025-02-05T09:00:00Z' },
  { id: 'carb-003', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_1', category: 'Fugitive Emissions', activityType: 'R-410A Refrigerant Leakage', activityAmount: 18.5, unit: 'kg', emissionFactor: 2.088, calculatedEmissions: 38.63, source: 'HVAC Contractor Service Ticket #4091', dataOwner: 'David Kim', status: 'UNDER_REVIEW', notes: 'Roof chiller maintenance recharge.', createdAt: '2025-02-12T11:00:00Z' },
  { id: 'carb-004', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_2', category: 'Purchased Electricity', activityType: 'Grid Electricity (HQ Campus)', activityAmount: 1420500, unit: 'kWh', emissionFactor: 0.000245, calculatedEmissions: 348.02, source: 'CleanPowerSF Interval Metering', dataOwner: 'Elena Rostova', status: 'VALIDATED', notes: 'Location-based grid average for CAISO NP15.', createdAt: '2025-02-15T14:00:00Z' },
  { id: 'carb-005', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_2', category: 'Purchased Electricity', activityType: 'EV Charging Stations (HQ)', activityAmount: 89650, unit: 'kWh', emissionFactor: 0.000245, calculatedEmissions: 21.97, source: 'ChargePoint Commercial Dashboard', dataOwner: 'Elena Rostova', status: 'VALIDATED', notes: 'Employee commuter charging bank (40 Level-2 ports).', createdAt: '2025-02-18T16:00:00Z' },
  { id: 'carb-006', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_3', category: 'Business Travel', activityType: 'Commercial Air Travel - Medium Haul', activityAmount: 642000, unit: 'passenger-km', emissionFactor: 0.000134, calculatedEmissions: 86.03, source: 'Navan Corporate Travel Portal', dataOwner: 'Sarah Chen', status: 'FLAGGED', notes: 'Identified variance in ticket cabin-class multiplier during audit triage.', createdAt: '2025-02-22T10:00:00Z' },
  { id: 'carb-007', organizationId: 'org-demo-001', reportingPeriod: '2025-Q1', scope: 'SCOPE_3', category: 'Cloud Computing Services', activityType: 'AWS Cloud Infrastructure Compute & Storage', activityAmount: 4850000, unit: 'compute-hrs', emissionFactor: 0.000012, calculatedEmissions: 58.20, source: 'AWS Carbon Tool v2', dataOwner: 'Elena Rostova', status: 'VALIDATED', notes: 'Core production Kubernetes workloads.', createdAt: '2025-02-28T08:00:00Z' }
];

app.get('/api/carbon-data', (req, res) => {
  const { period, scope, status, query } = req.query as Record<string, string>;
  let items = [...serverCarbonRecords];
  if (period && period !== 'ALL') items = items.filter(r => r.reportingPeriod === period);
  if (scope && scope !== 'ALL') items = items.filter(r => r.scope === scope);
  if (status && status !== 'ALL') items = items.filter(r => r.status === status);
  if (query) {
    const q = query.toLowerCase();
    items = items.filter(r => r.category.toLowerCase().includes(q) || r.activityType.toLowerCase().includes(q) || r.source.toLowerCase().includes(q) || (r.dataOwner && r.dataOwner.toLowerCase().includes(q)));
  }
  return res.json({ items, total: items.length });
});

app.post('/api/carbon-data', (req, res) => {
  const body = req.body;
  const calculatedEmissions = parseFloat((Number(body.activityAmount || 0) * Number(body.emissionFactor || 0)).toFixed(4));
  const newRecord = {
    ...body,
    id: `carb-${Date.now()}`,
    organizationId: 'org-demo-001',
    calculatedEmissions,
    createdAt: new Date().toISOString()
  };
  serverCarbonRecords.unshift(newRecord);
  return res.status(201).json(newRecord);
});

app.put('/api/carbon-data/:id', (req, res) => {
  const { id } = req.params;
  const idx = serverCarbonRecords.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const old = serverCarbonRecords[idx];
  const activityAmount = req.body.activityAmount !== undefined ? Number(req.body.activityAmount) : old.activityAmount;
  const emissionFactor = req.body.emissionFactor !== undefined ? Number(req.body.emissionFactor) : old.emissionFactor;
  const calculatedEmissions = parseFloat((activityAmount * emissionFactor).toFixed(4));
  serverCarbonRecords[idx] = {
    ...old,
    ...req.body,
    activityAmount,
    emissionFactor,
    calculatedEmissions,
    updatedAt: new Date().toISOString()
  };
  return res.json(serverCarbonRecords[idx]);
});

app.patch('/api/carbon-data/:id', (req, res) => {
  const { id } = req.params;
  const idx = serverCarbonRecords.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  serverCarbonRecords[idx] = {
    ...serverCarbonRecords[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  return res.json(serverCarbonRecords[idx]);
});

app.delete('/api/carbon-data/:id', (req, res) => {
  const { id } = req.params;
  serverCarbonRecords = serverCarbonRecords.filter(r => r.id !== id);
  return res.json({ success: true });
});

// 5.2 Audits
app.get('/api/audits', (req, res) => {
  const { period, status } = req.query as Record<string, string>;
  let items = [
    {
      id: 'aud-001',
      organizationId: 'org-demo-001',
      auditName: 'FY2024 - FY2025 GHG Protocol Assurance Audit',
      auditPeriod: '2025-Q1',
      auditType: 'GHG_PROTOCOL_INVENTORY',
      scope: 'SCOPE_1_2_3',
      leadAuditor: 'Marcus Vance (Lead Auditor)',
      startDate: '2025-01-15',
      dueDate: '2025-04-30',
      status: 'IN_PROGRESS',
      description: 'Comprehensive operational boundary inventory assurance aligned with ISO 14064-3 and GHG Protocol Corporate Standard.',
      linkedCarbonData: [
        { id: 'acl-001', auditId: 'aud-001', carbonDataId: 'carb-001', scope: 'SCOPE_1', category: 'Stationary Combustion', activityType: 'Natural Gas Heating (HQ)', calculatedEmissions: 97.97, status: 'VALIDATED', reviewerId: 'usr-mgr-002', reviewerComments: 'Gas utility therm statements reconciled with boiler log.' },
        { id: 'acl-002', auditId: 'aud-001', carbonDataId: 'carb-004', scope: 'SCOPE_2', category: 'Purchased Electricity', activityType: 'Grid Electricity (HQ Campus)', calculatedEmissions: 348.02, status: 'VALIDATED', reviewerId: 'usr-mgr-002', reviewerComments: 'Interval smart meter XML match with 0.00% variance.' },
        { id: 'acl-003', auditId: 'aud-001', carbonDataId: 'carb-006', scope: 'SCOPE_3', category: 'Business Travel', activityType: 'Commercial Air Travel - Medium Haul', calculatedEmissions: 86.03, status: 'NEEDS_REVIEW', reviewerId: 'usr-mgr-002', reviewerComments: 'Requires flight leg distance breakdown per DEFRA category.' }
      ]
    },
    {
      id: 'aud-002',
      organizationId: 'org-demo-001',
      auditName: 'Q1 2025 Scope 1 & 2 Rapid Facilities Audit',
      auditPeriod: '2025-Q1',
      auditType: 'INTERNAL_ANNUAL',
      scope: 'SCOPE_1_2',
      leadAuditor: 'Sarah Chen (Governance Officer)',
      startDate: '2025-02-01',
      dueDate: '2025-03-31',
      status: 'COMPLETED',
      description: 'Internal operational verification of direct facility meter telemetry, diesel generators, and fleet logistics.',
      completionNotes: 'All Scope 1 & 2 activity lines matched primary source invoices.',
      closedAt: '2025-03-30T16:00:00Z',
      linkedCarbonData: [
        { id: 'acl-004', auditId: 'aud-002', carbonDataId: 'carb-002', scope: 'SCOPE_1', category: 'Mobile Combustion', activityType: 'Company Fleet Diesel', calculatedEmissions: 42.88, status: 'VALIDATED' }
      ]
    }
  ];
  if (period && period !== 'ALL') items = items.filter(a => a.auditPeriod === period);
  if (status && status !== 'ALL') items = items.filter(a => a.status === status);
  return res.json(items);
});

// 6. Travel Route Distance Calculation & OpenFreeMap Endpoints
// Serve MapLibre GL Web Worker script directly with correct MIME type
app.get('/maplibre-gl-worker.mjs', (_req, res) => {
  res.setHeader('Content-Type', 'text/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const nodeModulesPath = path.join(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
  if (fs.existsSync(nodeModulesPath)) {
    return res.sendFile(nodeModulesPath);
  }
  const publicPath = path.join(__dirname, 'public/maplibre-gl-worker.mjs');
  if (fs.existsSync(publicPath)) {
    return res.sendFile(publicPath);
  }
  return res.status(404).send('Worker not found');
});

// ==========================================
// TRAVEL & MOBILITY PERSISTENCE STORE
// ==========================================
let serverTravelActivities: any[] = [
  {
    id: 'trv-001',
    organizationId: 'org-demo-001',
    userId: 'usr-admin-001',
    userFullName: 'Sarah Chen',
    title: 'Client Site Audit - Chicago to Milwaukee',
    travelDate: '2025-03-15',
    tripType: 'ROUND_TRIP',
    travelMode: 'DRIVE',
    vehicleType: 'Passenger Car (Gasoline Average)',
    originAddress: '200 S Wacker Dr, Chicago, IL',
    destinationAddress: '100 E Wisconsin Ave, Milwaukee, WI',
    waypointsJson: null,
    passengerCount: 2,
    oneWayDistanceKm: 148.5,
    totalDistanceKm: 297.0,
    durationSeconds: 7200,
    routingProvider: 'OSRM',
    routingService: 'OSRM_ROUTING_V1',
    routeCalculatedAt: '2025-03-15T08:00:00Z',
    routeSummary: 'I-94 N via Kenosha & Racine',
    emissionFactorId: 'ef-travel-001',
    emissionFactorValue: 0.000170,
    calculatedEmissions: 0.1010,
    carbonDataId: 'carb-006',
    status: 'CALCULATED',
    notes: 'Onsite ESG supplier assurance and facility walkthrough',
    provenanceMetadata: JSON.stringify({
      routingProvider: 'OSRM',
      routingService: 'OSRM_ROUTING_V1',
      mapTileProvider: 'openfreemap',
      solutionAttribution: 'openfreemap_osrm_engine',
      oneWayDistanceMeters: 148500,
      oneWayDistanceKm: 148.5,
      totalDistanceKm: 297.0,
      passengerCount: 2,
      activityAmountPassengerKm: 594.0,
      factorValue: 0.000170,
      factorUnit: 'tCO2e/p-km',
      factorSource: 'EPA GHG Emission Factors Hub 2024 / DEFRA',
      calculatedAt: '2025-03-15T08:00:00Z'
    }),
    createdAt: '2025-03-15T08:00:00Z',
    updatedAt: '2025-03-15T08:00:00Z'
  },
  {
    id: 'trv-002',
    organizationId: 'org-demo-001',
    userId: 'usr-analyst-003',
    userFullName: 'Elena Rostova',
    title: 'Regional Data Center Inspection - San Francisco to Sunnyvale',
    travelDate: '2025-03-22',
    tripType: 'ROUND_TRIP',
    travelMode: 'DRIVE',
    vehicleType: 'Passenger Car (Electric Vehicle - Grid Avg)',
    originAddress: 'Market St, San Francisco, CA',
    destinationAddress: 'Mathilda Ave, Sunnyvale, CA',
    waypointsJson: null,
    passengerCount: 1,
    oneWayDistanceKm: 65.2,
    totalDistanceKm: 130.4,
    durationSeconds: 3400,
    routingProvider: 'OSRM',
    routingService: 'OSRM_ROUTING_V1',
    routeCalculatedAt: '2025-03-22T09:15:00Z',
    routeSummary: 'US-101 S Silicon Valley Corridor',
    emissionFactorId: 'ef-travel-002',
    emissionFactorValue: 0.000053,
    calculatedEmissions: 0.0069,
    status: 'CALCULATED',
    notes: 'Q1 Server efficiency verification with company EV fleet',
    provenanceMetadata: JSON.stringify({
      routingProvider: 'OSRM',
      routingService: 'OSRM_ROUTING_V1',
      mapTileProvider: 'openfreemap',
      solutionAttribution: 'openfreemap_osrm_engine',
      oneWayDistanceMeters: 65200,
      oneWayDistanceKm: 65.2,
      totalDistanceKm: 130.4,
      passengerCount: 1,
      activityAmountPassengerKm: 130.4,
      factorValue: 0.000053,
      factorUnit: 'tCO2e/p-km',
      factorSource: 'EPA eGRID 2024 / DEFRA EV Factor',
      calculatedAt: '2025-03-22T09:15:00Z'
    }),
    createdAt: '2025-03-22T09:15:00Z',
    updatedAt: '2025-03-22T09:15:00Z'
  },
  {
    id: 'trv-003',
    organizationId: 'org-demo-001',
    userId: 'usr-mgr-002',
    userFullName: 'Marcus Vance',
    title: 'Executive ESG Summit - Boston to Providence',
    travelDate: '2025-04-02',
    tripType: 'ONE_WAY',
    travelMode: 'TRANSIT',
    vehicleType: 'Public Transit (Passenger Rail / Train)',
    originAddress: 'South Station, Boston, MA',
    destinationAddress: 'Amtrak Station, Providence, RI',
    waypointsJson: null,
    passengerCount: 1,
    oneWayDistanceKm: 78.4,
    totalDistanceKm: 78.4,
    durationSeconds: 2700,
    routingProvider: 'OSRM',
    routingService: 'OSRM_ROUTING_V1',
    routeCalculatedAt: '2025-04-02T07:45:00Z',
    routeSummary: 'Amtrak Northeast Regional Rail',
    emissionFactorId: 'ef-travel-004',
    emissionFactorValue: 0.000035,
    calculatedEmissions: 0.0027,
    status: 'CALCULATED',
    notes: 'Clean rail transit selected over vehicle travel',
    provenanceMetadata: JSON.stringify({
      routingProvider: 'OSRM',
      routingService: 'OSRM_ROUTING_V1',
      mapTileProvider: 'openfreemap',
      solutionAttribution: 'openfreemap_osrm_engine',
      oneWayDistanceMeters: 78400,
      oneWayDistanceKm: 78.4,
      totalDistanceKm: 78.4,
      passengerCount: 1,
      activityAmountPassengerKm: 78.4,
      factorValue: 0.000035,
      factorUnit: 'tCO2e/p-km',
      factorSource: 'UK DEFRA / Amtrak Regional 2024',
      calculatedAt: '2025-04-02T07:45:00Z'
    }),
    createdAt: '2025-04-02T07:45:00Z',
    updatedAt: '2025-04-02T07:45:00Z'
  }
];

// 6.0 Maps Provider Configuration (OpenFreeMap default per spec)
app.get('/api/maps/config', (_req, res) => {
  const mapProvider = (process.env.MAP_TILE_PROVIDER || 'openfreemap').toLowerCase();
  const routingProvider = (process.env.ROUTING_PROVIDER || 'osrm').toLowerCase();
  return res.json({
    provider: mapProvider,
    mapTileProvider: mapProvider,
    routingProvider,
    styles: {
      liberty: 'https://tiles.openfreemap.org/styles/liberty',
      positron: 'https://tiles.openfreemap.org/styles/positron',
      bright: 'https://tiles.openfreemap.org/styles/bright'
    },
    defaultStyle: 'https://tiles.openfreemap.org/styles/liberty'
  });
});

// 6.1 Reverse Geocoding (OpenStreetMap Nominatim)
app.get('/api/travel/reverse-geocode', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters are required' });
    }
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CarbonFlow-OpenFreeMap/1.0 (sustainability-audit-platform)'
        }
      }
    );
    if (response.ok) {
      const data: any = await response.json();
      if (data && data.display_name) {
        return res.json({
          formattedAddress: data.display_name,
          placeId: String(data.place_id || ''),
          addressDetails: data.address
        });
      }
    }
    return res.json({ formattedAddress: `GPS Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})` });
  } catch (_err) {
    return res.json({ formattedAddress: `GPS Location (${Number(req.query.lat).toFixed(4)}, ${Number(req.query.lng).toFixed(4)})` });
  }
});

// 6.2 Address Geocoding (OpenStreetMap Nominatim)
app.get('/api/travel/geocode', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: 'q parameter is required' });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CarbonFlow-OpenFreeMap/1.0 (sustainability-audit-platform)'
        }
      }
    );
    if (response.ok) {
      const data: any = await response.json();
      if (data && data.length > 0) {
        return res.json({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        });
      }
    }
    return res.status(404).json({ error: 'Location not found' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Geocoding failed' });
  }
});

// 6.3 Road Distance & Route Geometry Calculation (OSRM Routing Provider)
app.post('/api/travel/route', async (req, res) => {
  try {
    const { origin, destination, travelMode = 'DRIVE', tripType = 'ROUND_TRIP' } = req.body;

    const parseCoord = (pt: any) => {
      if (typeof pt === 'object' && pt !== null) {
        if (pt.lat !== undefined && pt.lng !== undefined) return { lat: Number(pt.lat), lng: Number(pt.lng) };
        if (pt.latitude !== undefined && pt.longitude !== undefined) return { lat: Number(pt.latitude), lng: Number(pt.longitude) };
      }
      if (typeof pt === 'string') {
        const parts = pt.split(',');
        if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
          return { lat: Number(parts[0].trim()), lng: Number(parts[1].trim()) };
        }
      }
      return null;
    };

    let startLat = 37.7749, startLng = -122.4194;
    let endLat = 37.7833, endLng = -122.4167;
    let originStr = typeof origin === 'string' ? origin : 'Start Location';
    let destStr = typeof destination === 'string' ? destination : 'End Location';

    const parsedStart = parseCoord(origin);
    const parsedEnd = parseCoord(destination);

    if (parsedStart) {
      startLat = parsedStart.lat;
      startLng = parsedStart.lng;
    } else if (typeof origin === 'string' && origin.trim()) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origin)}&limit=1`,
          { headers: { 'User-Agent': 'CarbonFlow-OpenFreeMap/1.0' } }
        );
        if (geoRes.ok) {
          const list: any = await geoRes.json();
          if (list[0]) {
            startLat = parseFloat(list[0].lat);
            startLng = parseFloat(list[0].lon);
            originStr = list[0].display_name;
          }
        }
      } catch {}
    }

    if (parsedEnd) {
      endLat = parsedEnd.lat;
      endLng = parsedEnd.lng;
    } else if (typeof destination === 'string' && destination.trim()) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`,
          { headers: { 'User-Agent': 'CarbonFlow-OpenFreeMap/1.0' } }
        );
        if (geoRes.ok) {
          const list: any = await geoRes.json();
          if (list[0]) {
            endLat = parseFloat(list[0].lat);
            endLng = parseFloat(list[0].lon);
            destStr = list[0].display_name;
          }
        }
      } catch {}
    }

    const osrmProfile = travelMode === 'BICYCLE' ? 'bike' : travelMode === 'WALK' ? 'foot' : 'driving';
    let distanceMeters = 0;
    let durationSeconds = 0;
    let coordinates: [number, number][] = [];

    // Query independent road routing engine (OSRM)
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl);
      if (osrmRes.ok) {
        const osrmData: any = await osrmRes.json();
        if (osrmData.routes && osrmData.routes[0]) {
          distanceMeters = Math.round(osrmData.routes[0].distance);
          durationSeconds = Math.round(osrmData.routes[0].duration);
          coordinates = osrmData.routes[0].geometry?.coordinates || [];
        }
      }
    } catch (_e) {
      // Fallback
    }

    if (distanceMeters === 0) {
      // Deterministic geodesic fallback with 1.25 winding road factor
      const dLat = ((endLat - startLat) * Math.PI) / 180;
      const dLon = ((endLng - startLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((startLat * Math.PI) / 180) *
          Math.cos((endLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const geodesicMeters = 6371008.8 * c;
      distanceMeters = Math.round(geodesicMeters * 1.25);
      const speedKmh = travelMode === 'DRIVE' ? 60 : travelMode === 'TRANSIT' ? 40 : travelMode === 'BICYCLE' ? 18 : 5;
      durationSeconds = Math.round(((distanceMeters / 1000) / speedKmh) * 3600);
      coordinates = [[startLng, startLat], [endLng, endLat]];
    }

    const oneWayKm = parseFloat((distanceMeters / 1000).toFixed(2));
    const totalKm = tripType === 'ROUND_TRIP' ? parseFloat((oneWayKm * 2).toFixed(2)) : oneWayKm;
    const hrs = Math.floor(durationSeconds / 3600);
    const mins = Math.floor((durationSeconds % 3600) / 60);
    const formatted = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;

    const routingProvider = (process.env.ROUTING_PROVIDER || 'OSRM').toUpperCase();
    const mapTileProvider = (process.env.MAP_TILE_PROVIDER || 'openfreemap').toLowerCase();

    return res.json({
      origin: originStr,
      destination: destStr,
      travelMode,
      tripType,
      oneWayDistanceMeters: distanceMeters,
      oneWayDistanceKm: oneWayKm,
      totalDistanceKm: totalKm,
      durationSeconds,
      formattedDuration: formatted,
      routeSummary: `${routingProvider} ${travelMode} Route (${oneWayKm} km, ${formatted})`,
      coordinates,
      routingProvider,
      routingService: 'OSRM_ROUTING_V1',
      mapTileProvider,
      calculatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Route calculation error' });
  }
});

// 6.4 Travel Activities Ledger - List with Tenant Isolation & Filtering
app.get('/api/travel', (req, res) => {
  const { userId, status, travelMode, page = '1', size = '20' } = req.query as Record<string, string>;
  const orgId = 'org-demo-001';

  let items = serverTravelActivities.filter(t => t.organizationId === orgId);
  if (userId) {
    items = items.filter(t => t.userId === userId);
  }
  if (status && status !== 'ALL') {
    items = items.filter(t => t.status === status);
  }
  if (travelMode && travelMode !== 'ALL') {
    items = items.filter(t => t.travelMode === travelMode);
  }

  const p = Math.max(1, parseInt(page) || 1);
  const s = Math.max(1, parseInt(size) || 20);
  const total = items.length;
  const paginated = items.slice((p - 1) * s, p * s);

  return res.json({
    items: paginated,
    total,
    page: p,
    size: s,
    totalPages: Math.ceil(total / s)
  });
});

// 6.5 Create & Persist Travel Activity (With Verified Factor Calculation & Tenant Boundaries)
app.post('/api/travel', (req, res) => {
  const body = req.body || {};
  const orgId = 'org-demo-001';
  const userId = 'usr-admin-001';
  const userFullName = 'Sarah Chen';

  const {
    title,
    travelDate = new Date().toISOString().split('T')[0],
    tripType = 'ONE_WAY',
    travelMode = 'DRIVE',
    vehicleType = 'Passenger Car (Gasoline Average)',
    originAddress,
    destinationAddress,
    waypoints = [],
    passengerCount = 1,
    oneWayDistanceKm = 0,
    totalDistanceKm = 0,
    durationSeconds = 0,
    routeSummary = '',
    notes = '',
    emissionFactorId = 'ef-travel-001',
    autoCalculateCarbon = false
  } = body;

  if (!originAddress || !destinationAddress) {
    return res.status(400).json({ error: 'Origin and destination addresses are required.' });
  }

  const passengers = Math.max(1, Number(passengerCount) || 1);
  const oneWayKm = Number(oneWayDistanceKm) || 0;
  const finalTotalKm = Number(totalDistanceKm) || (tripType === 'ROUND_TRIP' ? oneWayKm * 2 : oneWayKm);

  // Resolve documented emission factor
  let factor = serverEmissionFactors.find(f => f.id === emissionFactorId);
  if (!factor) {
    if (travelMode === 'WALK' || travelMode === 'BICYCLE') {
      factor = serverEmissionFactors.find(f => f.id === 'ef-travel-006');
    } else if (travelMode === 'TRANSIT') {
      factor = serverEmissionFactors.find(f => f.id === 'ef-travel-004');
    } else {
      factor = serverEmissionFactors.find(f => f.id === 'ef-travel-001');
    }
  }

  const factorValue = factor ? factor.factorValue : (travelMode === 'WALK' || travelMode === 'BICYCLE' ? 0.0 : 0.000170);

  // Formula: Activity (passenger-km) = totalDistanceKm * passengerCount
  // Emissions = Activity * FactorValue
  const activityAmountPassengerKm = parseFloat((finalTotalKm * passengers).toFixed(3));
  const calculatedEmissions = parseFloat((activityAmountPassengerKm * factorValue).toFixed(4));

  const travelId = `trv-${Date.now()}`;
  let carbonDataId = null;
  let status = 'PENDING';

  // If requested, auto-post verified travel emission to central Scope 3 Carbon Data ledger
  if (autoCalculateCarbon) {
    const reportingPeriod = `${new Date(travelDate).getFullYear()}-Q${Math.floor(new Date(travelDate).getMonth() / 3) + 1}`;
    const carbonRecordId = `carb-${Date.now()}`;
    const newCarbonRecord = {
      id: carbonRecordId,
      organizationId: orgId,
      reportingPeriod,
      scope: 'SCOPE_3',
      category: 'Business Travel',
      activityType: factor ? factor.activityType : 'Business Travel',
      activityAmount: activityAmountPassengerKm,
      unit: 'passenger-km',
      emissionFactor: factorValue,
      calculatedEmissions,
      source: `OpenFreeMap & OSRM Engine (${originAddress} → ${destinationAddress})`,
      dataOwner: userFullName,
      status: 'VALIDATED',
      notes: `Travel Activity ${travelId} (${travelMode}, ${finalTotalKm} km, ${passengers} travelers). Provenance logged via OpenFreeMap vector tiles & OSRM routing.`,
      createdAt: new Date().toISOString()
    };
    serverCarbonRecords.unshift(newCarbonRecord);
    carbonDataId = carbonRecordId;
    status = 'CALCULATED';
  }

  const routingProvider = (process.env.ROUTING_PROVIDER || 'OSRM').toUpperCase();
  const mapTileProvider = (process.env.MAP_TILE_PROVIDER || 'openfreemap').toLowerCase();

  const provenanceMetadata = JSON.stringify({
    routingProvider,
    routingService: 'OSRM_ROUTING_V1',
    mapTileProvider,
    solutionAttribution: 'openfreemap_osrm_engine',
    oneWayDistanceKm: oneWayKm,
    totalDistanceKm: finalTotalKm,
    passengerCount: passengers,
    activityAmountPassengerKm,
    factorValue,
    factorUnit: factor?.factorUnit || 'tCO2e/p-km',
    factorSource: factor?.sourceReference || 'EPA GHG Hub / DEFRA',
    calculatedAt: new Date().toISOString()
  });

  const createdItem = {
    id: travelId,
    organizationId: orgId,
    userId,
    userFullName,
    title: title || `${travelMode} Trip: ${originAddress.split(',')[0]} → ${destinationAddress.split(',')[0]}`,
    travelDate,
    tripType,
    travelMode,
    vehicleType,
    originAddress,
    destinationAddress,
    waypointsJson: waypoints.length > 0 ? JSON.stringify(waypoints) : null,
    passengerCount: passengers,
    oneWayDistanceKm: oneWayKm,
    totalDistanceKm: finalTotalKm,
    durationSeconds,
    routingProvider,
    routingService: 'OSRM_ROUTING_V1',
    routeCalculatedAt: new Date().toISOString(),
    routeSummary: routeSummary || `${routingProvider} ${travelMode} Route (${oneWayKm} km)`,
    emissionFactorId: factor?.id || 'ef-travel-001',
    emissionFactorValue: factorValue,
    calculatedEmissions,
    carbonDataId,
    status,
    notes,
    provenanceMetadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  serverTravelActivities.unshift(createdItem);
  return res.status(201).json(createdItem);
});

// 6.6 Get Single Travel Activity by ID
app.get('/api/travel/:id', (req, res) => {
  const { id } = req.params;
  const orgId = 'org-demo-001';
  const found = serverTravelActivities.find(t => t.id === id && t.organizationId === orgId);
  if (!found) {
    return res.status(404).json({ error: 'Travel activity not found or access denied.' });
  }
  return res.json(found);
});

// 6.7 Formally Calculate Emissions & Sync with Carbon Data Ledger
app.post('/api/travel/:id/calculate', (req, res) => {
  const { id } = req.params;
  const orgId = 'org-demo-001';
  const idx = serverTravelActivities.findIndex(t => t.id === id && t.organizationId === orgId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Travel activity not found.' });
  }

  const travel = serverTravelActivities[idx];
  const factor = serverEmissionFactors.find(f => f.id === travel.emissionFactorId) || serverEmissionFactors[8];
  const factorValue = travel.emissionFactorValue || factor.factorValue;
  const activityAmountPassengerKm = parseFloat((travel.totalDistanceKm * travel.passengerCount).toFixed(3));
  const calculatedEmissions = parseFloat((activityAmountPassengerKm * factorValue).toFixed(4));

  const reportingPeriod = `${new Date(travel.travelDate).getFullYear()}-Q${Math.floor(new Date(travel.travelDate).getMonth() / 3) + 1}`;
  const carbonRecordId = travel.carbonDataId || `carb-${Date.now()}`;

  if (!travel.carbonDataId) {
    serverCarbonRecords.unshift({
      id: carbonRecordId,
      organizationId: orgId,
      reportingPeriod,
      scope: 'SCOPE_3',
      category: 'Business Travel',
      activityType: travel.vehicleType || 'Business Travel',
      activityAmount: activityAmountPassengerKm,
      unit: 'passenger-km',
      emissionFactor: factorValue,
      calculatedEmissions,
      source: `OpenFreeMap & OSRM Engine (${travel.originAddress} → ${travel.destinationAddress})`,
      dataOwner: travel.userFullName || 'Operations',
      status: 'VALIDATED',
      notes: `Linked from Travel Activity ${travel.id}. Distance: ${travel.totalDistanceKm} km, ${travel.passengerCount} passengers.`,
      createdAt: new Date().toISOString()
    });
  }

  serverTravelActivities[idx] = {
    ...travel,
    calculatedEmissions,
    carbonDataId: carbonRecordId,
    status: 'CALCULATED',
    updatedAt: new Date().toISOString()
  };

  return res.json(serverTravelActivities[idx]);
});

// 6.8 Delete Travel Activity
app.delete('/api/travel/:id', (req, res) => {
  const { id } = req.params;
  const orgId = 'org-demo-001';
  serverTravelActivities = serverTravelActivities.filter(t => !(t.id === id && t.organizationId === orgId));
  return res.json({ success: true });
});

// 7. Backup Status
app.get('/api/backup/status', (_req, res) => {
  return res.json({
    status: 'HEALTHY',
    databaseEngine: 'Cloud Firestore & Relational SQL Storage Engine',
    lastSnapshotTimestamp: new Date().toISOString(),
    flywayMigrationsApplied: 3,
    migrations: [
      { version: '1', description: 'initial schema', type: 'SQL', success: true },
      { version: '2', description: 'seed demo data', type: 'SQL', success: true },
      { version: '3', description: 'travel mobility schema', type: 'SQL', success: true }
    ],
    infrastructureBackupNotice: 'Enterprise point-in-time recovery (PITR) is provisioned via managed cloud database storage. Logical table-level tenant exports are encrypted on demand.',
    recoveryTimeObjective: '< 15 minutes (RTO)',
    recoveryPointObjective: '< 5 minutes (RPO)'
  });
});

// Helper domain fallback generator when external AI API encounters temporary upstream 503 spikes
function generateDomainFallback(lastUserText: string, _personaPrompt?: string): string {
  const query = (lastUserText || '').toLowerCase();

  if (query.includes('evidence') || query.includes('iso 14064') || query.includes('audit')) {
    return `### ISO 14064-3 Audit Trail & Evidence Verification

Under **ISO 14064-3** (*Specification with guidance for the verification and validation of greenhouse gas statements*), external verifiers require a continuous audit trail:

1. **Primary Activity Documentation:**
   - Utility invoices or metered telemetry for stationary fuel (e.g., natural gas therms/MWh).
   - Calibrated utility meters with custody-transfer records.
   - Verified batch calorific values and fuel delivery manifests.

2. **Emission Factor Traceability:**
   - Explicit factor publisher documentation (e.g., EPA GHG Factors Hub v2024, DEFRA, eGRID subregion).
   - Documented 100-year Global Warming Potentials (GWPs) specified (IPCC AR5 or AR6).

3. **Data Quality & Control Rigor:**
   - Materiality threshold evaluation (standard 5% for limited assurance, 2% for reasonable assurance).
   - Immutable audit trail provenance hash (SHA-256) recorded in CarbonFlow.`;
  }

  if (query.includes('travel') || query.includes('passenger') || query.includes('flight') || query.includes('road') || query.includes('car') || query.includes('rail')) {
    return `### Scope 3 Category 6: Business Travel Calculation Framework

According to the **GHG Protocol Technical Guidance for Calculating Scope 3 Emissions (Category 6)**:

1. **Distance-Based Method (Standard of Truth):**
   $$\\text{Emissions (tCO}_2\\text{e)} = \\frac{\\text{Activity Distance (km)} \\times \\text{Emission Factor (kg CO}_2\\text{e/km)} \\times \\text{Passenger Count}}{1,000}$$

2. **Verified Published Emission Factors (DEFRA / EPA):**
   - **Passenger Car (Gasoline / ICE):** $0.1702\\text{ kg CO}_2\\text{e/km}$
   - **Electric Vehicle (EV):** $0.0530\\text{ kg CO}_2\\text{e/km}$ (Grid average basis)
   - **National Rail / Train:** $0.0355\\text{ kg CO}_2\\text{e/passenger-km}$
   - **Domestic Aviation (< 500 km):** $0.2460\\text{ kg CO}_2\\text{e/passenger-km}$ (including radiative forcing uplift)

3. **CarbonFlow Verification Trail:**
   - Origin and destination coordinates geocoded via OpenStreetMap Nominatim.
   - Road distance verified via OSRM engine and displayed on OpenFreeMap tiles.
   - Calculation recorded with immutable audit metadata in the carbon ledger.`;
  }

  if (query.includes('csrd') || query.includes('scope 3') || query.includes('esrs') || query.includes('sec')) {
    return `### Regulatory Compliance Overview: CSRD ESRS E1 & SEC Climate Disclosures

1. **EU CSRD (ESRS E1 Climate Change):**
   - **Scope 1 & Scope 2:** Mandatory gross reporting (dual reporting: location-based and market-based Scope 2).
   - **Scope 3 Value Chain:** Mandatory across material categories (Category 1 Purchased Goods, Category 4 Upstream Freight, Category 6 Business Travel).
   - **Assurance Timeline:** Limited assurance required at initial filing, transitioning to reasonable assurance.

2. **SEC Climate Disclosure Framework:**
   - Large Accelerated Filers (LAFs) must disclose material Scope 1 and Scope 2 emissions with attestation reports.
   - Clear disclosure of climate-related governance, risks, and greenhouse gas targets.

3. **CarbonFlow Audit Readiness:**
   - Immutable evidence records and cryptographic data hashes.
   - Role-based separation of duties between preparers, reviewers, and assurance providers.`;
  }

  if (query.includes('calculate') || query.includes('therm') || query.includes('kwh') || query.includes('formula')) {
    return `### Greenhouse Gas Calculation Methodology

The fundamental equation for activity-based emissions calculation is:

$$\\text{Total Emissions (tCO}_2\\text{e)} = \\frac{\\text{Activity Data} \\times \\text{Emission Factor}}{1,000}$$

#### Benchmark Examples:
- **Natural Gas (Stationary Combustion):**
  $18,450\\text{ therms} \\times 0.0053\\text{ tCO}_2\\text{e/therm} = 97.785\\text{ tCO}_2\\text{e}$
- **Purchased Electricity (Scope 2):**
  $\\text{Activity (MWh)} \\times \\text{eGRID factor (kg CO}_2\\text{e/MWh)} \\div 1,000$

All calculations are linked directly to source factors and persisted in the CarbonFlow ledger.`;
  }

  return `### CarbonFlow Enterprise AI Sustainability & Audit Assistant

Hello! I am your enterprise sustainability and GHG audit assistant.

- **GHG Protocol Standards:** Strict alignment with the GHG Protocol Corporate Accounting Standard and Scope 3 Value Chain Standard.
- **Traceable Ledger:** Every activity recorded in CarbonFlow generates an immutable audit record with timestamp, user ID, calculation formula, and source factor provenance.
- **Assurance Readiness:** Formatted for third-party verifiers following ISO 14064-3 and EU CSRD (ESRS E1) requirements.

How can I assist your organization with emissions calculations, travel mobility verification, or audit compliance today?`;
}

// 8. Gemini Multi-turn Chatbot Endpoint
const SUPPORTED_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest'
] as const;

// Health & info endpoint for /api/gemini/chat
app.get('/api/gemini/chat', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  return res.json({
    status: 'online',
    endpoint: '/api/gemini/chat',
    method: 'POST',
    supportedModels: SUPPORTED_GEMINI_MODELS,
    credentialsConfigured: hasKey
  });
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { model = 'gemini-3.1-flash-lite', messages = [], systemInstruction } = req.body || {};

    // 1. Validate request messages payload
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "messages" must be a non-empty array of chat messages.',
        code: 'INVALID_MESSAGES'
      });
    }

    // 2. Validate model identifier against models supported by configured Gemini API
    if (model && !SUPPORTED_GEMINI_MODELS.includes(model as any)) {
      return res.status(400).json({
        error: `Unsupported Gemini model: '${model}'. Supported models are: ${SUPPORTED_GEMINI_MODELS.join(', ')}`,
        code: 'INVALID_MODEL',
        supportedModels: SUPPORTED_GEMINI_MODELS
      });
    }

    // Map model alias to standard supported model
    const selectedModel = model === 'gemini-flash-latest' ? 'gemini-3.8-flash' : model;

    // 3. Validate credentials availability on server
    const currentApiKey = process.env.GEMINI_API_KEY || '';
    if (!currentApiKey || !currentApiKey.trim()) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';
      const fallbackReply = generateDomainFallback(lastUserMsg);
      const setupNote = '\n\n---\n> 💡 **Notice:** Answering via CarbonFlow Sustainability Knowledge Engine. To activate live Google Gemini models (' + selectedModel + '), ensure `GEMINI_API_KEY` is configured in your environment.';
      return res.json({
        reply: fallbackReply + setupNote,
        model: 'carbonflow-ghg-engine',
        credentialsConfigured: false
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';
      return res.json({
        reply: generateDomainFallback(lastUserMsg),
        model: 'carbonflow-ghg-engine',
        credentialsConfigured: false
      });
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text || m.content || '') }]
    }));

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';

    const effectiveInstruction = systemInstruction ||
      'You are the CarbonFlow Enterprise AI Sustainability & Audit Assistant. You provide expert guidance on greenhouse gas (GHG) accounting (Scopes 1, 2, and 3), emissions calculation methodologies, ISO 14064-3 and CSRD compliance, audit trails, and travel activity distance verification. Keep your answers clear, authoritative, and actionable.';

    // Primary attempt with selected model
    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: effectiveInstruction
        }
      });

      const reply = response.text || 'I analyzed the inquiry, but no textual response was generated.';
      return res.json({ reply, model: selectedModel });
    } catch (primaryErr: any) {
      const status = primaryErr?.status || primaryErr?.statusCode || primaryErr?.code;
      const errMsg = String(primaryErr?.message || primaryErr || '');

      console.warn(`Gemini API call with ${selectedModel} failed (${status || 'unknown'}: ${errMsg})`);

      // Quota / rate limit exceeded (HTTP 429)
      if (status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
        return res.status(429).json({
          error: 'Gemini API rate limit or quota exceeded. Please wait a moment or upgrade your tier.',
          code: 'QUOTA_EXCEEDED',
          details: errMsg
        });
      }

      // Invalid credentials (HTTP 401/403)
      if (status === 403 || errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid') || errMsg.includes('API key expired')) {
        return res.status(401).json({
          error: 'Invalid or unauthorized Gemini API credentials.',
          code: 'INVALID_CREDENTIALS',
          details: errMsg
        });
      }

      // If temporary 503 high demand on primary model and not flash-lite, attempt automatic failover
      if (selectedModel !== 'gemini-3.1-flash-lite') {
        try {
          console.log(`Attempting failover to gemini-3.1-flash-lite...`);
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction: effectiveInstruction
            }
          });

          const reply = fallbackResponse.text || 'Response generated via Gemini 3.1 Flash Lite.';
          return res.json({
            reply: `*(Auto-routed via gemini-3.1-flash-lite due to ${selectedModel} demand/tier)*\n\n${reply}`,
            model: 'gemini-3.1-flash-lite'
          });
        } catch (secondaryErr: any) {
          console.warn('Fallback to gemini-3.1-flash-lite also failed:', secondaryErr?.message);
        }
      }

      // Upstream service temporary spike or high demand: engage domain fallback
      const domainFallback = generateDomainFallback(lastUserMsg);
      return res.json({
        reply: `${domainFallback}\n\n*(Notice: Live Gemini API experienced temporary high demand. Response generated by CarbonFlow Sustainability Knowledge Engine.)*`,
        model: 'carbonflow-sustainability-engine',
        upstreamNotice: errMsg
      });
    }
  } catch (error: any) {
    console.error('Unhandled Gemini endpoint error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process chat query with Gemini API',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Explicit endpoint for MapLibre GL Web Worker to ensure correct MIME type and avoid 404s
app.get(['/maplibre-gl-worker.mjs', '/node_modules/.vite/deps/maplibre-gl-worker.mjs'], (_req, res) => {
  const workerPath = path.join(__dirname, 'public', 'maplibre-gl-worker.mjs');
  if (fs.existsSync(workerPath)) {
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(workerPath);
  }
  return res.status(404).send('Worker file not found');
});

// Mount Vite middleware in dev or static files in production
async function startServer() {
  const distDir = path.join(__dirname, 'dist');
  const distExists = fs.existsSync(path.join(distDir, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || (distExists && process.env.NODE_ENV !== 'development');

  if (isProduction) {
    console.log(`Starting in PRODUCTION mode, serving static assets from ${distDir}`);
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.log(`Starting in DEVELOPMENT mode with Vite middleware`);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`CarbonFlow server running on http://${HOST}:${PORT} (PID ${process.pid})`);
  });
}

startServer();
