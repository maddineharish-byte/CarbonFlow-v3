import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function verifyPostRestart() {
  console.log('Testing persistence across actual backend restart...');

  // 1. Read the newly registered tenant user email from the DB file
  const dbPath = path.join(process.cwd(), 'data', 'carbonflow-db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const tenantUsers = db.users.filter((u: any) => u.email.includes('cso-'));
  if (tenantUsers.length === 0) {
    console.error('No tenant user found in persisted DB file!');
    process.exit(1);
  }
  const tenantUser = tenantUsers[tenantUsers.length - 1];
  console.log(`Found persisted tenant user: ${tenantUser.email} (org: ${tenantUser.organizationId})`);

  // 2. Login as this tenant after the server restart
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tenantUser.email, password: tenantUser.password })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    console.error('Failed to log in as persisted user after backend restart!', loginData);
    process.exit(1);
  }
  console.log('✅ Successfully authenticated as persisted tenant user after server restart');

  // 3. Fetch carbon records for this tenant
  const carbonRes = await fetch(`${BASE_URL}/api/carbon-data`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const carbonData = await carbonRes.json();
  if (carbonRes.status !== 200 || carbonData.items.length !== 2) {
    console.error(`Expected 2 persisted carbon records, found: ${carbonData.items?.length}`);
    process.exit(1);
  }
  console.log(`✅ Successfully retrieved ${carbonData.items.length} persisted carbon records after restart`);

  // 4. Check dashboard calculations
  const dashRes = await fetch(`${BASE_URL}/api/reports/dashboard`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const dashData = await dashRes.json();
  if (dashRes.status !== 200 || dashData.totalEmissions !== 106.6) {
    console.error(`Expected 106.6 total emissions, got: ${dashData.totalEmissions}`);
    process.exit(1);
  }
  console.log(`✅ Dashboard calculations intact after backend restart: Total ${dashData.totalEmissions} tCO2e (Scope 1: ${dashData.scope1Emissions}, Scope 2: ${dashData.scope2Emissions})`);

  // 5. Check evidence records
  const evidenceRes = await fetch(`${BASE_URL}/api/evidence`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const evidenceData = await evidenceRes.json();
  if (evidenceRes.status !== 200 || evidenceData.items.length !== 1 || evidenceData.items[0].status !== 'VERIFIED') {
    console.error('Evidence record not preserved correctly after restart!');
    process.exit(1);
  }
  console.log(`✅ Verified evidence records intact after restart: ${evidenceData.items[0].evidenceName} (${evidenceData.items[0].status})`);

  // 6. Check audits and findings
  const auditRes = await fetch(`${BASE_URL}/api/audits`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const auditData = await auditRes.json();
  if (auditRes.status !== 200 || auditData.length !== 1) {
    console.error('Audit schedule not preserved correctly after restart!');
    process.exit(1);
  }
  console.log(`✅ Audit schedule intact after restart: ${auditData[0].auditName}`);

  console.log('\n🎉 ALL PERSISTENCE TESTS PASSED ACROSS REAL BACKEND RESTART!');
  process.exit(0);
}

verifyPostRestart().catch(err => {
  console.error('Post-restart test failed:', err);
  process.exit(1);
});
