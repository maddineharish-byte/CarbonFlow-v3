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
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Server-side GoogleGenAI client per gemini_api skill
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

app.get('/api/maps/config', (_req, res) => {
  return res.json({
    provider: 'OpenFreeMap',
    styles: {
      liberty: 'https://tiles.openfreemap.org/styles/liberty',
      positron: 'https://tiles.openfreemap.org/styles/positron',
      bright: 'https://tiles.openfreemap.org/styles/bright'
    },
    defaultStyle: 'https://tiles.openfreemap.org/styles/liberty'
  });
});

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
      routeSummary: `OpenFreeMap • OSRM Open Source Route (${oneWayKm} km, ${formatted})`,
      coordinates,
      routingProvider: 'OPEN_FREE_MAP',
      routingService: 'OSRM_NOMINATIM',
      calculatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Route calculation error' });
  }
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

// 8. Gemini Multi-turn Chatbot Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { model = 'gemini-3.5-flash', messages = [], systemInstruction } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const validModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    const selectedModel = validModels.includes(model) ? model : 'gemini-3.5-flash';

    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text || m.content || '') }]
    }));

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: systemInstruction || 'You are the CarbonFlow Enterprise AI Sustainability & Audit Assistant. You provide expert guidance on greenhouse gas (GHG) accounting (Scopes 1, 2, and 3), emissions calculation methodologies, ISO 14064-3 and CSRD compliance, audit trails, and travel activity distance verification. Keep your answers clear, authoritative, and actionable.'
        }
      });

      const reply = response.text || 'I analyzed the inquiry, but no textual response was generated.';
      return res.json({ reply, model: selectedModel });
    } catch (modelErr: any) {
      if (selectedModel === 'gemini-3.1-pro-preview') {
        console.warn('gemini-3.1-pro-preview unavailable or quota exhausted; falling back to gemini-3.5-flash');
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents,
            config: {
              systemInstruction: systemInstruction || 'You are the CarbonFlow Enterprise AI Sustainability & Audit Assistant. Keep your answers clear, authoritative, and actionable.'
            }
          });
          const reply = `*(Notice: Processed via gemini-3.5-flash due to Pro tier availability/quota)*\n\n${fallbackResponse.text || ''}`;
          return res.json({ reply, model: 'gemini-3.5-flash' });
        } catch (fbErr) {
          throw modelErr;
        }
      }
      throw modelErr;
    }
  } catch (error: any) {
    console.error('Gemini API chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process chat query with Gemini API',
      details: String(error)
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
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarbonFlow dev server running on port ${PORT}`);
  });
}

startServer();
