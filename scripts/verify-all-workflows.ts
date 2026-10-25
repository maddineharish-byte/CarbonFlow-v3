import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  workflow: string;
  testName: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, workflow: string, testName: string, details: string) {
  results.push({
    workflow,
    testName,
    passed: Boolean(condition),
    details
  });
  if (!condition) {
    console.error(`❌ [${workflow}] ${testName} FAILED: ${details}`);
  } else {
    console.log(`✅ [${workflow}] ${testName}: ${details}`);
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  const res = await fetch(url, { ...options, headers });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function runAllTests() {
  console.log('====================================================');
  console.log('STARTING CARBONFLOW FUNCTIONAL WORKFLOW VERIFICATION');
  console.log('====================================================\n');

  // ==========================================
  // 1. WORKFLOW: AUTHENTICATION
  // ==========================================
  console.log('--- Testing Workflow 1: Authentication ---');

  // 1.1 Login with valid admin credentials
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@carbonflow.io', password: 'Password123!' })
  });
  assert(
    loginRes.status === 200 && Boolean(loginRes.data?.token) && loginRes.data?.role === 'COMPANY_ADMIN',
    'Authentication',
    'Login valid corporate admin credentials',
    `Status: ${loginRes.status}, user: ${loginRes.data?.fullName}, role: ${loginRes.data?.role}`
  );
  const adminToken = loginRes.data?.token;
  const adminOrgId = loginRes.data?.organizationId;

  // 1.2 Login with invalid credentials rejected
  const badLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@carbonflow.io', password: 'WrongPassword999!' })
  });
  assert(
    badLoginRes.status === 401,
    'Authentication',
    'Reject invalid password',
    `Status: ${badLoginRes.status}, error: ${badLoginRes.data?.error}`
  );

  // 1.3 Register a new distinct organization and tenant user
  const tenantEmail = `cso-${Date.now()}@ecosphere.global`;
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: tenantEmail,
      fullName: 'Alex Vance',
      organizationName: 'EcoSphere Global Logistics',
      title: 'Chief Sustainability Officer',
      password: 'SecurePassword2026!'
    })
  });
  assert(
    registerRes.status === 200 && Boolean(registerRes.data?.token) && registerRes.data?.organizationId !== adminOrgId,
    'Authentication',
    'Register new tenant organization and corporate administrator',
    `Status: ${registerRes.status}, org: ${registerRes.data?.organizationName} (${registerRes.data?.organizationId})`
  );
  const tenantToken = registerRes.data?.token;
  const tenantOrgId = registerRes.data?.organizationId;

  // 1.4 Password Reset with verified current password
  const resetPassRes = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: tenantEmail,
      oldPassword: 'SecurePassword2026!',
      newPassword: 'NewSecurePassword2026!'
    })
  });
  assert(
    resetPassRes.status === 200 && resetPassRes.data?.code === 'PASSWORD_RESET_PROCESSED',
    'Authentication',
    'Password reset requiring verified current password',
    `Status: ${resetPassRes.status}, code: ${resetPassRes.data?.code}`
  );

  // 1.5 Verify login with newly set password
  const newPassLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: tenantEmail, password: 'NewSecurePassword2026!' })
  });
  assert(
    newPassLogin.status === 200 && Boolean(newPassLogin.data?.token),
    'Authentication',
    'Authenticate successfully with new password after reset',
    `Status: ${newPassLogin.status}`
  );

  // ==========================================
  // 2. WORKFLOW: ORGANIZATION ISOLATION
  // ==========================================
  console.log('\n--- Testing Workflow 2: Organization Isolation ---');

  // 2.1 Demo org has preloaded records
  const adminCarbonRes = await request('/api/carbon-data', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    adminCarbonRes.status === 200 && adminCarbonRes.data?.items?.length > 0,
    'Organization Isolation',
    'Org 1 (demo org) retrieves authorized records',
    `Found ${adminCarbonRes.data?.items?.length} records for ${adminOrgId}`
  );

  // 2.2 New tenant org has 0 records initially
  const tenantCarbonRes = await request('/api/carbon-data', {
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  assert(
    tenantCarbonRes.status === 200 && tenantCarbonRes.data?.items?.length === 0,
    'Organization Isolation',
    'Org 2 sees exactly 0 records and cannot see Org 1 records',
    `Total records visible to tenant ${tenantOrgId}: ${tenantCarbonRes.data?.items?.length}`
  );

  // 2.3 Org 2 cannot read, edit, or delete Org 1's carbon record
  const demoRecordId = adminCarbonRes.data?.items[0]?.id;
  const crossOrgDeleteRes = await request(`/api/carbon-data/${demoRecordId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  assert(
    crossOrgDeleteRes.status === 404,
    'Organization Isolation',
    'Cross-organization delete attempt rejected',
    `Status: ${crossOrgDeleteRes.status} (record not found/access denied in caller's tenant)`
  );

  const crossOrgPutRes = await request(`/api/carbon-data/${demoRecordId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({ activityAmount: 999999 })
  });
  assert(
    crossOrgPutRes.status === 404,
    'Organization Isolation',
    'Cross-organization update attempt rejected',
    `Status: ${crossOrgPutRes.status} (record not found/access denied in caller's tenant)`
  );

  // ==========================================
  // 3. WORKFLOW: CARBON DATA CREATION & EDITING
  // ==========================================
  console.log('\n--- Testing Workflow 3: Carbon-Data Creation and Editing ---');

  // 3.1 Create Carbon Record under Tenant 2
  const createRecordRes = await request('/api/carbon-data', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      reportingPeriod: '2025-Q1',
      scope: 'SCOPE_1',
      category: 'Stationary Combustion',
      activityType: 'Facility Heating Boiler (Natural Gas)',
      activityAmount: 10000,
      unit: 'therms',
      emissionFactor: 0.0053,
      source: 'Meter Gas Utility statement #ECO-4401',
      dataOwner: 'Alex Vance',
      status: 'UNDER_REVIEW',
      notes: 'Initial operational baseline for logistics warehouse'
    })
  });
  const createdRecord = createRecordRes.data;
  assert(
    createRecordRes.status === 201 &&
    createdRecord?.calculatedEmissions === 53.0 &&
    createdRecord?.organizationId === tenantOrgId,
    'Carbon Data',
    'Create carbon record with verified emissions calculation (10000 * 0.0053 = 53.0 tCO2e)',
    `Status: ${createRecordRes.status}, id: ${createdRecord?.id}, emissions: ${createdRecord?.calculatedEmissions}`
  );

  // 3.2 Edit Carbon Record and verify dynamic recalculation
  const editRecordRes = await request(`/api/carbon-data/${createdRecord.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      activityAmount: 12000,
      emissionFactor: 0.0053,
      notes: 'Updated statement reconciliation with secondary utility meter'
    })
  });
  assert(
    editRecordRes.status === 200 && editRecordRes.data?.calculatedEmissions === 63.6,
    'Carbon Data',
    'Edit carbon record with dynamic emissions recalculation (12000 * 0.0053 = 63.6 tCO2e)',
    `Status: ${editRecordRes.status}, calculated: ${editRecordRes.data?.calculatedEmissions}`
  );

  // 3.3 Create a Scope 2 record for Tenant 2 to test dashboard aggregation
  const createS2Res = await request('/api/carbon-data', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      reportingPeriod: '2025-Q1',
      scope: 'SCOPE_2',
      category: 'Purchased Electricity',
      activityType: 'Warehouse Solar + Grid Blend',
      activityAmount: 200000,
      unit: 'kWh',
      emissionFactor: 0.000215,
      source: 'Smart telemetry feed',
      dataOwner: 'Alex Vance',
      status: 'VALIDATED'
    })
  });
  assert(
    createS2Res.status === 201 && createS2Res.data?.calculatedEmissions === 43.0,
    'Carbon Data',
    'Create Scope 2 electricity record (200000 * 0.000215 = 43.0 tCO2e)',
    `Status: ${createS2Res.status}, emissions: ${createS2Res.data?.calculatedEmissions}`
  );

  // ==========================================
  // 4. WORKFLOW: EVIDENCE MANAGEMENT
  // ==========================================
  console.log('\n--- Testing Workflow 4: Evidence Management ---');

  // 4.1 Upload/Create Evidence
  const createEvidenceRes = await request('/api/evidence', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      evidenceName: 'Logistics Facility Gas Statement Q1 2025',
      evidenceType: 'UTILITY_STATEMENT',
      reportingPeriod: '2025-Q1',
      source: 'SoCalGas Portal',
      linkedCarbonDataId: createdRecord.id,
      description: 'Monthly utility invoices confirming 12,000 therms'
    })
  });
  const createdEvidence = createEvidenceRes.data;
  assert(
    createEvidenceRes.status === 201 && createdEvidence?.status === 'PENDING' && createdEvidence?.organizationId === tenantOrgId,
    'Evidence Management',
    'Upload evidence item linked to carbon data',
    `Status: ${createEvidenceRes.status}, id: ${createdEvidence?.id}, org: ${createdEvidence?.organizationId}`
  );

  // 4.2 List Evidence filtered by organization
  const listEvidenceRes = await request('/api/evidence', {
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  assert(
    listEvidenceRes.status === 200 && listEvidenceRes.data?.items?.length === 1,
    'Evidence Management',
    'List evidence scoped strictly to tenant',
    `Found ${listEvidenceRes.data?.items?.length} evidence items for tenant`
  );

  // 4.3 Verify Evidence
  const verifyEvidenceRes = await request(`/api/evidence/${createdEvidence.id}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      status: 'VERIFIED',
      verificationNotes: 'Matched against primary utility account statements with 0.0% variance'
    })
  });
  assert(
    verifyEvidenceRes.status === 200 &&
    verifyEvidenceRes.data?.status === 'VERIFIED' &&
    Boolean(verifyEvidenceRes.data?.verifiedAt),
    'Evidence Management',
    'Formally verify evidence item with auditor sign-off notes',
    `Status: ${verifyEvidenceRes.status}, verifiedBy: ${verifyEvidenceRes.data?.verifiedBy}`
  );

  // ==========================================
  // 5. WORKFLOW: AUDITS & VALIDATION
  // ==========================================
  console.log('\n--- Testing Workflow 5: Audits ---');

  // 5.1 Create an Audit
  const createAuditRes = await request('/api/audits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      auditName: 'EcoSphere 2025 Q1 Interim GHG Verification',
      auditPeriod: '2025-Q1',
      auditType: 'GHG_PROTOCOL_INVENTORY',
      scope: 'SCOPE_1_2',
      leadAuditor: 'Alex Vance',
      startDate: '2025-04-01',
      dueDate: '2025-05-30',
      status: 'IN_PROGRESS',
      description: 'Comprehensive operational boundary assurance under ISO 14064-3 standards',
      linkedCarbonData: [
        {
          id: 'acl-eco-001',
          carbonDataId: createdRecord.id,
          scope: 'SCOPE_1',
          category: 'Stationary Combustion',
          calculatedEmissions: 63.6,
          status: 'NEEDS_REVIEW'
        }
      ]
    })
  });
  const createdAudit = createAuditRes.data;
  assert(
    createAuditRes.status === 201 && createdAudit?.organizationId === tenantOrgId,
    'Audits',
    'Create formal assurance audit schedule linked to carbon records',
    `Status: ${createAuditRes.status}, id: ${createdAudit?.id}`
  );

  // 5.2 Validate Carbon Record within Audit
  const validateRecordRes = await request(`/api/audits/${createdAudit.id}/validate/${createdRecord.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      status: 'VALIDATED',
      comments: 'Utility invoices and boiler maintenance logs corroborate all activity lines.'
    })
  });
  assert(
    validateRecordRes.status === 200 && validateRecordRes.data?.status === 'VALIDATED',
    'Audits',
    'Validate carbon record through audit assurance workflow',
    `Status: ${validateRecordRes.status}`
  );

  // Verify carbon record status updated in primary ledger
  const checkUpdatedRecord = await request('/api/carbon-data', {
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  const validatedItem = checkUpdatedRecord.data?.items.find((r: any) => r.id === createdRecord.id);
  assert(
    validatedItem?.status === 'VALIDATED',
    'Audits',
    'Primary carbon record status synchronized to VALIDATED following audit validation',
    `Record status: ${validatedItem?.status}`
  );

  // ==========================================
  // 6. WORKFLOW: FINDINGS MANAGEMENT
  // ==========================================
  console.log('\n--- Testing Workflow 6: Findings ---');

  // 6.1 Create Finding
  const createFindingRes = await request('/api/findings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      auditId: createdAudit.id,
      title: 'Missing Calibrated Meter Calibration Certificate',
      description: 'Natural gas interval meter calibration log past the 12-month ISO requirement.',
      severity: 'MEDIUM',
      source: 'Onsite Meter Inspection',
      relatedCarbonDataId: createdRecord.id,
      status: 'OPEN',
      dueDate: '2025-05-15'
    })
  });
  const createdFinding = createFindingRes.data;
  assert(
    createFindingRes.status === 201 && createdFinding?.organizationId === tenantOrgId,
    'Findings',
    'Register audit non-conformity finding',
    `Status: ${createFindingRes.status}, id: ${createdFinding?.id}, severity: ${createdFinding?.severity}`
  );

  // 6.2 List Findings
  const listFindingsRes = await request('/api/findings', {
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  assert(
    listFindingsRes.status === 200 && listFindingsRes.data?.length === 1,
    'Findings',
    'List findings isolated to tenant',
    `Found ${listFindingsRes.data?.length} findings for tenant`
  );

  // 6.3 Update Finding
  const updateFindingRes = await request(`/api/findings/${createdFinding.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      status: 'IN_PROGRESS',
      description: 'Technician dispatched for calibration on 2025-04-18'
    })
  });
  assert(
    updateFindingRes.status === 200 && updateFindingRes.data?.status === 'IN_PROGRESS',
    'Findings',
    'Update finding triage status',
    `Status: ${updateFindingRes.status}, findingStatus: ${updateFindingRes.data?.status}`
  );

  // ==========================================
  // 7. WORKFLOW: CORRECTIVE ACTIONS
  // ==========================================
  console.log('\n--- Testing Workflow 7: Corrective Actions ---');

  // 7.1 Create Corrective Action
  const createCARes = await request('/api/corrective-actions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      findingId: createdFinding.id,
      actionTitle: 'Schedule Certified Meter Calibration & Issue Service Certificate',
      description: 'Engage authorized meter maintenance vendor for recertification',
      priority: 'HIGH',
      dueDate: '2025-05-10',
      status: 'OPEN'
    })
  });
  const createdCA = createCARes.data;
  assert(
    createCARes.status === 201 && createdCA?.organizationId === tenantOrgId,
    'Corrective Actions',
    'Create corrective action assigned to finding',
    `Status: ${createCARes.status}, id: ${createdCA?.id}, priority: ${createdCA?.priority}`
  );

  // 7.2 Update Corrective Action to IN_PROGRESS
  const updateCARes = await request(`/api/corrective-actions/${createdCA.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      status: 'IN_PROGRESS',
      completionNotes: 'Vendor contract executed under #VC-8802'
    })
  });
  assert(
    updateCARes.status === 200 && updateCARes.data?.status === 'IN_PROGRESS',
    'Corrective Actions',
    'Advance corrective action progress and track execution notes',
    `Status: ${updateCARes.status}, actionStatus: ${updateCARes.data?.status}`
  );

  // ==========================================
  // 8. WORKFLOW: AUDIT HISTORY (AUDIT LOGS)
  // ==========================================
  console.log('\n--- Testing Workflow 8: Audit History ---');

  const auditLogsRes = await request('/api/audit-logs', {
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  assert(
    auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data) && auditLogsRes.data.length >= 4,
    'Audit History',
    'Chronological audit provenance trail recorded automatically on mutations',
    `Recorded ${auditLogsRes.data?.length} audit events for tenant`
  );

  // Verify all logged events belong to this tenant
  const foreignLogs = auditLogsRes.data.filter((l: any) => l.organizationId !== tenantOrgId);
  assert(
    foreignLogs.length === 0,
    'Audit History',
    'Zero cross-tenant audit log leakage',
    `Foreign logs in tenant stream: ${foreignLogs.length}`
  );

  // ==========================================
  // 9. WORKFLOW: DASHBOARD CALCULATIONS
  // ==========================================
  console.log('\n--- Testing Workflow 9: Dashboard Calculations (Live vs Hardcoded) ---');

  const dashboardRes = await request('/api/reports/dashboard', {
    headers: { Authorization: `Bearer ${tenantToken}` }
  });
  const metrics = dashboardRes.data;

  // Expected for Tenant 2:
  // Scope 1: 63.6 tCO2e (1 record)
  // Scope 2: 43.0 tCO2e (1 record)
  // Scope 3: 0.0 tCO2e (0 records)
  // Total: 106.6 tCO2e (2 records)
  const expectedTotal = 106.6;
  const isDynamicTotal = Math.abs(metrics.totalEmissions - expectedTotal) < 0.01;
  const isNotHardcodedDemoStats = metrics.totalEmissions !== 693.68 && metrics.totalCarbonRecords === 2;

  assert(
    dashboardRes.status === 200 && isDynamicTotal && isNotHardcodedDemoStats,
    'Dashboard Calculations',
    'Dashboard computes live emissions directly from tenant authorized records (not hardcoded stats)',
    `Scope 1: ${metrics.scope1Emissions}, Scope 2: ${metrics.scope2Emissions}, Total: ${metrics.totalEmissions} tCO2e`
  );

  assert(
    metrics.totalEvidenceRecords === 1 && metrics.verifiedEvidenceRecords === 1,
    'Dashboard Calculations',
    'Dashboard reflects live verified evidence counts dynamically',
    `Total evidence: ${metrics.totalEvidenceRecords}, verified: ${metrics.verifiedEvidenceRecords}`
  );

  assert(
    metrics.activeAudits === 1 && metrics.openFindings === 1 && metrics.totalCorrectiveActions === 1,
    'Dashboard Calculations',
    'Dashboard reflects live audits, findings, and actions dynamically',
    `Active audits: ${metrics.activeAudits}, open findings: ${metrics.openFindings}, actions: ${metrics.totalCorrectiveActions}`
  );

  // ==========================================
  // 10. WORKFLOW: REPORTS
  // ==========================================
  console.log('\n--- Testing Workflow 10: Reports ---');

  // Verify breakdown by scope matches the 2 created records
  const s1Breakdown = metrics.emissionsByScope.find((s: any) => s.scope.includes('Scope 1'));
  const s2Breakdown = metrics.emissionsByScope.find((s: any) => s.scope.includes('Scope 2'));
  const s3Breakdown = metrics.emissionsByScope.find((s: any) => s.scope.includes('Scope 3'));

  assert(
    s1Breakdown?.emissions === 63.6 && s2Breakdown?.emissions === 43.0 && s3Breakdown?.emissions === 0,
    'Reports',
    'Emissions by scope breakdown correctly computes individual totals',
    `S1: ${s1Breakdown?.emissions}, S2: ${s2Breakdown?.emissions}, S3: ${s3Breakdown?.emissions}`
  );

  assert(
    metrics.emissionsByPeriod && metrics.emissionsByPeriod.length > 0 && metrics.emissionsByPeriod[0].totalEmissions === 106.6,
    'Reports',
    'Emissions by period correctly aggregates quarterly emissions',
    `Period: ${metrics.emissionsByPeriod[0]?.reportingPeriod}, emissions: ${metrics.emissionsByPeriod[0]?.totalEmissions}`
  );

  // ==========================================
  // 11. WORKFLOW: PERSISTENCE
  // ==========================================
  console.log('\n--- Testing Workflow 11: Persistence ---');

  // 11.1 Verify data/carbonflow-db.json exists on disk and contains created tenant data
  const dbPath = path.join(process.cwd(), 'data', 'carbonflow-db.json');
  const fileExists = fs.existsSync(dbPath);
  let fileContainsTenantData = false;
  let fileParsed: any = null;

  if (fileExists) {
    try {
      fileParsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      fileContainsTenantData = fileParsed.carbonRecords.some((r: any) => r.id === createdRecord.id);
    } catch {}
  }

  assert(
    fileExists && fileContainsTenantData,
    'Persistence',
    'Created records are written synchronously to persistent JSON storage engine on disk',
    `File: ${dbPath}, record persisted: ${fileContainsTenantData}`
  );

  // 11.2 Verify that reading the file directly matches what the API returned
  const persistedRecord = fileParsed?.carbonRecords?.find((r: any) => r.id === createdRecord.id);
  assert(
    persistedRecord?.calculatedEmissions === 63.6 && persistedRecord?.status === 'VALIDATED',
    'Persistence',
    'Persisted database record state matches in-memory and API state identically',
    `Emissions: ${persistedRecord?.calculatedEmissions}, status: ${persistedRecord?.status}`
  );

  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total assertions: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error('\nSome workflows failed assertions!');
    process.exit(1);
  } else {
    console.log('\nAll workflows tested successfully with 100% pass rate!');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
