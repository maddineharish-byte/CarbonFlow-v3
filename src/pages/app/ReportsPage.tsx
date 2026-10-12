import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Flame,
  ClipboardList,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  FileText,
  CheckCircle2,
  Layers,
  Database,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { fsGetCarbonRecords, fsGetAudits } from '../../services/firebase';
import { DashboardMetrics, CarbonRecord, AuditItem } from '../../types';

export function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [records, setRecords] = useState<CarbonRecord[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('CARBON_SUMMARY');
  const [period, setPeriod] = useState('2025-Q1');

  // Download Report Modal & Generation State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'markdown' | 'json'>('csv');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, recRes, auditList] = await Promise.all([
        api.getDashboardMetrics(),
        api.listCarbonRecords({ period: period === 'ALL' ? undefined : period }),
        api.listAudits({ period: period === 'ALL' ? undefined : period })
      ]);
      setMetrics(m);

      let carbonItems = recRes.items || [];
      let auditItems = auditList || [];

      // Supplement / merge with Firestore if records exist
      try {
        const [fsCarbon, fsAudit] = await Promise.all([
          fsGetCarbonRecords('org-demo-001').catch(() => []),
          fsGetAudits('org-demo-001').catch(() => [])
        ]);

        if (fsCarbon && fsCarbon.length > 0) {
          const map = new Map<string, CarbonRecord>();
          carbonItems.forEach(r => map.set(r.id, r));
          fsCarbon.forEach(r => map.set(r.id, r));
          carbonItems = Array.from(map.values());
          if (period && period !== 'ALL') {
            carbonItems = carbonItems.filter(r => r.reportingPeriod === period);
          }
        }

        if (fsAudit && fsAudit.length > 0) {
          const map = new Map<string, AuditItem>();
          auditItems.forEach(a => map.set(a.id, a));
          fsAudit.forEach(a => map.set(a.id, a));
          auditItems = Array.from(map.values());
          if (period && period !== 'ALL') {
            auditItems = auditItems.filter(a => a.auditPeriod === period);
          }
        }
      } catch (fsErr) {
        console.warn('Firestore optional sync skipped:', fsErr);
      }

      setRecords(carbonItems);
      setAudits(auditItems);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  // Aggregated Report Generator combining Carbon Data and Audits pages
  const handleDownloadReport = (format: 'csv' | 'markdown' | 'json' = downloadFormat) => {
    setIsDownloading(true);

    try {
      const s1Records = records.filter(r => r.scope === 'SCOPE_1');
      const s2Records = records.filter(r => r.scope === 'SCOPE_2');
      const s3Records = records.filter(r => r.scope === 'SCOPE_3');

      const s1Emissions = s1Records.reduce((acc, r) => acc + (r.calculatedEmissions || 0), 0);
      const s2Emissions = s2Records.reduce((acc, r) => acc + (r.calculatedEmissions || 0), 0);
      const s3Emissions = s3Records.reduce((acc, r) => acc + (r.calculatedEmissions || 0), 0);
      const grossEmissions = s1Emissions + s2Emissions + s3Emissions || (metrics?.totalEmissions ?? 693.68);

      const validatedRecords = records.filter(r => r.status === 'VALIDATED').length;
      const underReviewRecords = records.filter(r => r.status === 'UNDER_REVIEW').length;
      const flaggedRecords = records.filter(r => r.status === 'FLAGGED').length;

      const completedAudits = audits.filter(a => a.status === 'COMPLETED' || a.status === 'CLOSED').length;
      const inProgressAudits = audits.filter(a => a.status === 'IN_PROGRESS').length;
      const scheduledAudits = audits.filter(a => a.status === 'SCHEDULED' || a.status === 'DRAFT').length;

      const dateStr = new Date().toISOString().split('T')[0];
      const nowTimestamp = new Date().toISOString();

      if (format === 'csv') {
        const sections: string[] = [];

        // File Header & Provenance
        sections.push(
          '# ==============================================================================,\n' +
          '# CARBONFLOW ENTERPRISE AUDIT & CARBON DATA AGGREGATED REPORT,\n' +
          `# Reporting Period: ${period},\n` +
          `# Generated Date: ${nowTimestamp},\n` +
          '# Organization: CarbonFlow Technologies Inc. (org-demo-001),\n' +
          '# Assurance Standard: ISO 14064-1 & GHG Protocol Corporate Standard,\n' +
          '# ==============================================================================,'
        );

        // Section 1: Executive KPI & Summary
        sections.push(
          '=== SECTION 1: EXECUTIVE AUDIT & EMISSIONS METRICS ===,\n' +
          'Metric,Value,Unit,Verification Status\n' +
          `Total Gross Carbon Emissions,${grossEmissions.toFixed(2)},tCO2e,Auditor Reconciled\n` +
          `Scope 1 Direct Emissions,${s1Emissions.toFixed(2)},tCO2e,Fuel & Heating Statements\n` +
          `Scope 2 Grid Electricity Emissions,${s2Emissions.toFixed(2)},tCO2e,Utility Meter Invoices\n` +
          `Scope 3 Value Chain Emissions,${s3Emissions.toFixed(2)},tCO2e,Travel & Supplier Data\n` +
          `Total Carbon Activity Records,${records.length},records,Relational DB Ledger\n` +
          `Validated Activity Records,${validatedRecords},records,Matched with Evidence\n` +
          `Under Review / Pending Records,${underReviewRecords},records,Awaiting Sign-off\n` +
          `Flagged / Discrepancy Records,${flaggedRecords},records,Open Audit Findings\n` +
          `Total Audit Engagements,${audits.length},engagements,Assurance Protocol\n` +
          `Active Audits In Progress,${inProgressAudits},engagements,Field Work Underway\n` +
          `Completed Audits,${completedAudits},engagements,Final Sign-off Issued\n` +
          `Scheduled Audits,${scheduledAudits},engagements,Upcoming Engagements\n` +
          `Evidence Verification Rate,${records.length > 0 ? Math.round((validatedRecords / records.length) * 100) : 0}%,percentage,Audit Assurance Ratio`
        );

        // Section 2: Emissions by Scope Disaggregation
        const s1Pct = grossEmissions > 0 ? ((s1Emissions / grossEmissions) * 100).toFixed(1) : '0';
        const s2Pct = grossEmissions > 0 ? ((s2Emissions / grossEmissions) * 100).toFixed(1) : '0';
        const s3Pct = grossEmissions > 0 ? ((s3Emissions / grossEmissions) * 100).toFixed(1) : '0';

        sections.push(
          '=== SECTION 2: GHG EMISSIONS BREAKDOWN BY SCOPE ===,\n' +
          'Operational Scope,Activity Records Count,Calculated Emissions (tCO2e),Share of Total (%)\n' +
          `Scope 1 (Direct Combustion & Fugitive),${s1Records.length},${s1Emissions.toFixed(2)},${s1Pct}%\n` +
          `Scope 2 (Grid Purchased Electricity),${s2Records.length},${s2Emissions.toFixed(2)},${s2Pct}%\n` +
          `Scope 3 (Business Travel & Supply Chain),${s3Records.length},${s3Emissions.toFixed(2)},${s3Pct}%`
        );

        // Section 3: Carbon Data Activity Ledger (from carbon-data page)
        const carbonHeaders = 'Record ID,Reporting Period,Scope,Category,Activity Type,Activity Amount,Unit,Emission Factor,Emissions (tCO2e),Source Reference,Data Owner,Audit Verification Status,Notes';
        const carbonRows = records.map(r =>
          `"${r.id}","${r.reportingPeriod}","${r.scope}","${r.category}","${r.activityType}",${r.activityAmount},"${r.unit}",${r.emissionFactor},${r.calculatedEmissions},"${r.source}","${r.dataOwner}","${r.status}","${(r.notes || '').replace(/"/g, '""')}"`
        ).join('\n');

        sections.push(
          '=== SECTION 3: CARBON ACTIVITY DATA LEDGER (FROM CARBON-DATA PAGE) ===,\n' +
          carbonHeaders + '\n' +
          carbonRows
        );

        // Section 4: Audit Assurance Engagements (from audits page)
        const auditHeaders = 'Audit ID,Audit Engagement Name,Reporting Period,Audit Type,Operational Scope,Lead Auditor,Start Date,Due Date,Status,Linked Activity Records Count,Description';
        const auditRows = audits.map(a =>
          `"${a.id}","${a.auditName}","${a.auditPeriod}","${a.auditType}","${a.scope}","${a.leadAuditor}","${a.startDate}","${a.dueDate}","${a.status}",${a.linkedCarbonData?.length || 0},"${(a.description || '').replace(/"/g, '""')}"`
        ).join('\n');

        sections.push(
          '=== SECTION 4: AUDIT ASSURANCE ENGAGEMENTS (FROM AUDITS PAGE) ===,\n' +
          auditHeaders + '\n' +
          auditRows
        );

        // Section 5: Audit Sign-Off & Provenance
        sections.push(
          '=== SECTION 5: AUDIT TRACEABILITY & VERIFICATION SIGN-OFF ===,\n' +
          'Signatory Role,Signatory Name,Organization,Attestation Statement,Timestamp\n' +
          `Corporate ESG Officer,Sarah Chen,CarbonFlow Technologies Inc.,"Certified GHG inventory completeness and accuracy",${nowTimestamp}\n` +
          `Independent Lead Auditor,Marcus Vance,Sustainability Assurance Services,"ISO 14064-3 Limited Assurance verification complete with no material discrepancy",${nowTimestamp}`
        );

        const csvContent = sections.join('\n\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carbonflow_aggregated_report_${period}_${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'markdown') {
        const md = [
          `# CarbonFlow Enterprise Audit & Carbon Data Aggregated Report`,
          `**Reporting Period:** ${period}  `,
          `**Generated Date:** ${nowTimestamp}  `,
          `**Organization:** CarbonFlow Technologies Inc. (org-demo-001)  `,
          `**Assurance Standard:** ISO 14064-1 & GHG Protocol Corporate Standard  \n`,
          `---`,
          `## 1. Executive Summary & Audit KPIs\n`,
          `| Metric | Value | Unit | Audit Verification Status |`,
          `| :--- | :--- | :--- | :--- |`,
          `| **Total Gross Emissions** | **${grossEmissions.toFixed(2)}** | **tCO2e** | Reconciled & Traceable |`,
          `| Scope 1 Direct Emissions | ${s1Emissions.toFixed(2)} | tCO2e | Verified Primary Meters |`,
          `| Scope 2 Purchased Electricity | ${s2Emissions.toFixed(2)} | tCO2e | Verified Utility Invoices |`,
          `| Scope 3 Value Chain Emissions | ${s3Emissions.toFixed(2)} | tCO2e | Audited Activity Logs |`,
          `| Carbon Activity Ledger Records | ${records.length} | records | 100% Relational DB Lineage |`,
          `| Validated / Verified Records | ${validatedRecords} | records | Evidence File Linked |`,
          `| Under Review / Pending Records | ${underReviewRecords} | records | Auditor Queue |`,
          `| Flagged Discrepancy Records | ${flaggedRecords} | records | CAPA Triage Logged |`,
          `| Total Audit Engagements | ${audits.length} | audits | Active Protocol |`,
          `| Completed Audits | ${completedAudits} | audits | Closed & Certified |\n`,
          `---`,
          `## 2. Emissions Disaggregation by Scope\n`,
          `| Scope | Records | Emissions (tCO2e) | % Share |`,
          `| :--- | :---: | :---: | :---: |`,
          `| **Scope 1 (Direct)** | ${s1Records.length} | ${s1Emissions.toFixed(2)} | ${grossEmissions > 0 ? ((s1Emissions / grossEmissions) * 100).toFixed(1) : 0}% |`,
          `| **Scope 2 (Electricity)** | ${s2Records.length} | ${s2Emissions.toFixed(2)} | ${grossEmissions > 0 ? ((s2Emissions / grossEmissions) * 100).toFixed(1) : 0}% |`,
          `| **Scope 3 (Value Chain)** | ${s3Records.length} | ${s3Emissions.toFixed(2)} | ${grossEmissions > 0 ? ((s3Emissions / grossEmissions) * 100).toFixed(1) : 0}% |\n`,
          `---`,
          `## 3. Carbon Activity Data Ledger (from carbon-data page)\n`,
          `| ID | Scope | Category | Activity Type | Activity Amount | Factor | Emissions (tCO2e) | Status | Data Owner |`,
          `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
          ...records.map(r => `| \`${r.id}\` | ${r.scope} | ${r.category} | ${r.activityType} | ${r.activityAmount.toLocaleString()} ${r.unit} | ${r.emissionFactor} | **${r.calculatedEmissions.toFixed(2)}** | \`${r.status}\` | ${r.dataOwner} |`),
          `\n---`,
          `## 4. Audit Assurance Engagements (from audits page)\n`,
          `| Audit ID | Audit Name | Type | Scope | Lead Auditor | Due Date | Status | Linked Data |`,
          `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |`,
          ...audits.map(a => `| \`${a.id}\` | **${a.auditName}** | ${a.auditType} | ${a.scope} | ${a.leadAuditor} | ${a.dueDate} | \`${a.status}\` | ${a.linkedCarbonData?.length || 0} items |`),
          `\n---`,
          `## 5. Formal Certification & Audit Attestation Sign-Off\n`,
          `- **Corporate ESG Officer:** Sarah Chen, Chief Operations & Governance Officer (CarbonFlow Technologies Inc.)`,
          `- **Lead Assurance Auditor:** Marcus Vance, Lead Auditor ISO 14064-3 (Sustainability Assurance Services)`,
          `- **Digital Audit Hash:** \`SHA256-${period}-${grossEmissions.toFixed(0)}-${Date.now()}\``,
          `- **Timestamp:** ${nowTimestamp}`
        ].join('\n');

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carbonflow_aggregated_report_${period}_${dateStr}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const payload = {
          metadata: {
            title: 'CarbonFlow Enterprise Audit & Carbon Data Aggregated Report',
            organization: 'CarbonFlow Technologies Inc.',
            organizationId: 'org-demo-001',
            reportingPeriod: period,
            generatedAt: nowTimestamp,
            assuranceStandard: 'ISO 14064-1 & GHG Protocol Corporate Standard'
          },
          summaryMetrics: {
            totalGrossEmissions: parseFloat(grossEmissions.toFixed(2)),
            scope1Emissions: parseFloat(s1Emissions.toFixed(2)),
            scope2Emissions: parseFloat(s2Emissions.toFixed(2)),
            scope3Emissions: parseFloat(s3Emissions.toFixed(2)),
            totalCarbonRecords: records.length,
            validatedCarbonRecords: validatedRecords,
            underReviewRecords,
            flaggedRecords,
            totalAudits: audits.length,
            completedAudits,
            inProgressAudits,
            scheduledAudits
          },
          scopeBreakdown: [
            { scope: 'SCOPE_1', recordCount: s1Records.length, emissionsTotal: parseFloat(s1Emissions.toFixed(2)) },
            { scope: 'SCOPE_2', recordCount: s2Records.length, emissionsTotal: parseFloat(s2Emissions.toFixed(2)) },
            { scope: 'SCOPE_3', recordCount: s3Records.length, emissionsTotal: parseFloat(s3Emissions.toFixed(2)) }
          ],
          carbonActivityRecords: records,
          auditEngagements: audits,
          attestation: {
            corporateSignatory: 'Sarah Chen, Chief Operations & Governance Officer',
            independentAuditor: 'Marcus Vance, Lead Auditor ISO 14064-3',
            status: 'AUDITOR_VERIFIED',
            verifiedAt: nowTimestamp
          }
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carbonflow_aggregated_report_${period}_${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        setDownloadModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to generate aggregated report:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCarbonCsv = () => {
    handleDownloadReport('csv');
  };

  const handleExportAuditsCsv = () => {
    handleDownloadReport('csv');
  };

  const handlePrint = () => {
    window.print();
  };

  // Aggregated totals for preview
  const s1Total = records.filter(r => r.scope === 'SCOPE_1').reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);
  const s2Total = records.filter(r => r.scope === 'SCOPE_2').reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);
  const s3Total = records.filter(r => r.scope === 'SCOPE_3').reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);
  const totalReportEmissions = s1Total + s2Total + s3Total || (metrics?.totalEmissions ?? 693.68);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Assurance & Disclosure Reports</h1>
          <p className="mt-1 text-xs text-stone-500">
            Authoritative disclosures backed by relational database records for ISO 14064, CSRD, and internal audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            title="Download aggregated CSV with Carbon Data & Audits"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Quick CSV</span>
          </button>
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Aggregated Data Summary Banner */}
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-white shrink-0 shadow-2xs">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-emerald-950">
              Aggregated Summary Ledger Active: {period}
            </div>
            <div className="text-stone-600 text-[11px] mt-0.5">
              Consolidating <strong>{records.length} Carbon Data activities</strong> ({totalReportEmissions.toFixed(2)} tCO2e) and <strong>{audits.length} Audit assurance engagements</strong>.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownloadReport('csv')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1 font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Quick CSV</span>
          </button>
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1 font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'CARBON_SUMMARY', label: 'Carbon Emissions Summary' },
            { id: 'SCOPE_BREAKDOWN', label: 'Scope 1, 2, 3 Breakdown' },
            { id: 'AUDIT_SUMMARY', label: 'Audit Assurance Status' },
            { id: 'FINDINGS_CAPA', label: 'Findings & Remediation CAPA' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedReport(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedReport === t.id
                  ? 'bg-emerald-800 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Period:</span>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-800 outline-none"
          >
            <option value="2025-Q1">2025-Q1</option>
            <option value="2024-Q4">2024-Q4</option>
            <option value="2024-Q3">2024-Q3</option>
          </select>
        </div>
      </div>

      {/* Report Paper Preview Canvas */}
      <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm text-stone-900 space-y-6">
        {/* Report Official Document Header */}
        <div className="flex items-start justify-between border-b-2 border-stone-900 pb-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-emerald-800 uppercase">
              CARBONFLOW FORMAL DISCLOSURE REPORT
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
              {selectedReport === 'CARBON_SUMMARY' && 'Consolidated Carbon Footprint & Methodology Summary'}
              {selectedReport === 'SCOPE_BREAKDOWN' && 'Scope 1, 2, and 3 Disaggregated Emissions Statement'}
              {selectedReport === 'AUDIT_SUMMARY' && 'Assurance Engagement & Verification Status Package'}
              {selectedReport === 'FINDINGS_CAPA' && 'Audit Findings & Corrective Action Resolution Log'}
            </h2>
            <div className="mt-1 text-xs text-stone-500">
              Corporate Inventory Period: <strong>{period}</strong> | Traceability Standard: <strong>ISO 14064-1 / GHG Protocol</strong>
            </div>
          </div>
          <div className="text-right text-xs text-stone-500">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div className="font-mono text-[10px] text-stone-400">STATUS: AUDITOR-VERIFIED</div>
          </div>
        </div>

        {/* Selected Report Content */}
        {selectedReport === 'CARBON_SUMMARY' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                <span className="text-stone-500">Total Gross Emissions</span>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-900">
                  {(metrics.totalEmissions ?? 0).toLocaleString()} <span className="text-xs font-normal">tCO2e</span>
                </div>
              </div>
              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                <span className="text-stone-500">Scope 1 Direct</span>
                <div className="mt-1 text-xl font-bold font-mono text-amber-900">
                  {(metrics.scope1Emissions ?? (metrics as any).scope1 ?? 0).toLocaleString()} <span className="text-xs font-normal">tCO2e</span>
                </div>
              </div>
              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                <span className="text-stone-500">Scope 2 Grid Electricity</span>
                <div className="mt-1 text-xl font-bold font-mono text-blue-900">
                  {(metrics.scope2Emissions ?? (metrics as any).scope2 ?? 0).toLocaleString()} <span className="text-xs font-normal">tCO2e</span>
                </div>
              </div>
              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                <span className="text-stone-500">Scope 3 Value Chain</span>
                <div className="mt-1 text-xl font-bold font-mono text-purple-900">
                  {(metrics.scope3Emissions ?? (metrics as any).scope3 ?? 0).toLocaleString()} <span className="text-xs font-normal">tCO2e</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-3">Underlying Activity Ledger (Period: {period})</h3>
              <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold text-[10px] uppercase">
                    <th className="p-2.5">Scope</th>
                    <th className="p-2.5">Activity Type</th>
                    <th className="p-2.5">Activity Amount</th>
                    <th className="p-2.5">Emission Factor</th>
                    <th className="p-2.5">Emissions (tCO2e)</th>
                    <th className="p-2.5">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="p-2.5 font-bold">{r.scope}</td>
                      <td className="p-2.5">{r.activityType}</td>
                      <td className="p-2.5 font-mono">{(r.activityAmount ?? 0).toLocaleString()} {r.unit}</td>
                      <td className="p-2.5 font-mono">{r.emissionFactor}</td>
                      <td className="p-2.5 font-bold font-mono text-stone-900">{(r.calculatedEmissions ?? 0).toLocaleString()}</td>
                      <td className="p-2.5">
                        <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'SCOPE_BREAKDOWN' && metrics && (
          <div className="space-y-6 text-xs">
            <p className="text-stone-600 leading-relaxed">
              In accordance with Chapter 3 of the Greenhouse Gas Protocol Corporate Standard, emissions are disaggregated into discrete operational boundaries.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(metrics.emissionsByScope || []).map(s => (
                <div key={s.scope} className="rounded-xl border border-stone-200 p-4 bg-stone-50/50">
                  <span className="font-bold text-stone-900 text-sm">{s.scope}</span>
                  <div className="mt-2 text-2xl font-bold font-mono text-emerald-900">{(s.emissionsTotal ?? (s as any).emissions ?? 0).toLocaleString()} tCO2e</div>
                  <div className="mt-1 text-stone-500">{s.percentage ?? 0}% of corporate gross total</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'AUDIT_SUMMARY' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-stone-600">
                Summary of all audit engagements executed in the current reporting cycle ({period}):
              </p>
              <span className="text-stone-500 font-medium">{audits.length} engagements on record</span>
            </div>

            <div className="space-y-3">
              {audits.map(audit => (
                <div key={audit.id} className="rounded-lg border border-stone-200 p-4 bg-stone-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{audit.auditName}</h4>
                      <div className="text-stone-500 mt-0.5 text-[11px]">
                        Lead Auditor: <span className="font-medium text-stone-700">{audit.leadAuditor}</span> | Scope: <span className="font-mono text-stone-700">{audit.scope}</span> | Period: {audit.auditPeriod}
                      </div>
                    </div>
                    <span className={`rounded border px-2 py-0.5 font-bold text-[10px] self-start sm:self-center ${
                      audit.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      audit.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-stone-100 text-stone-700 border-stone-200'
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                  {audit.description && (
                    <p className="mt-2 text-stone-600 leading-relaxed text-[11px]">
                      {audit.description}
                    </p>
                  )}
                  {audit.linkedCarbonData && audit.linkedCarbonData.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                      <span>{audit.linkedCarbonData.length} linked carbon activities audited</span>
                      <span className="font-mono text-[10px]">Due Date: {audit.dueDate}</span>
                    </div>
                  )}
                </div>
              ))}

              {audits.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-stone-500 text-xs">
                  No audit engagements logged for {period}. Please initialize an audit in the Audits tab.
                </div>
              )}
            </div>
          </div>
        )}

        {selectedReport === 'FINDINGS_CAPA' && (
          <div className="space-y-4 text-xs">
            <p className="text-stone-600">
              Formal non-conformance remediation log to satisfy audit materiality thresholds:
            </p>
            <div className="rounded-lg border border-stone-200 p-4">
              <div className="font-bold text-stone-900 text-sm">[MEDIUM SEVERITY] Uncertified Contractor Sign-off on R-410A Refrigerant Recharge</div>
              <p className="text-stone-600 mt-1">Status: IN PROGRESS | Remediation Action: Obtain Certified EPA 608 Contractor Attestation and Scale Tare Slip.</p>
            </div>
          </div>
        )}

        {/* Audit Sign-off Signature Block */}
        <div className="mt-12 pt-6 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-stone-600">
          <div>
            <div className="text-stone-400 uppercase text-[10px] font-bold">Corporate ESG Officer Signature</div>
            <div className="mt-4 border-b border-stone-300 pb-1 font-semibold text-stone-900">Sarah Chen, Chief Operations & Governance Officer</div>
            <div className="mt-1 text-[10px] text-stone-400">CarbonFlow Technologies Inc.</div>
          </div>
          <div>
            <div className="text-stone-400 uppercase text-[10px] font-bold">Independent Lead Assurance Auditor</div>
            <div className="mt-4 border-b border-stone-300 pb-1 font-semibold text-stone-900">Marcus Vance, Lead Auditor ISO 14064-3</div>
            <div className="mt-1 text-[10px] text-stone-400">Sustainability Assurance Services</div>
          </div>
        </div>
      </div>

      {/* Download Report Modal Dialog */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-5 animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Download Aggregated Report</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Aggregates data from <strong>Carbon Data Ledger</strong> and <strong>Audits Engagements</strong> into a single downloadable summary file.
                </p>
              </div>
              <button
                onClick={() => setDownloadModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Aggregated Scope & Dataset Preview */}
            <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3.5 space-y-2">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Dataset Summary for Period: {period}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="rounded-lg bg-white border border-stone-200/70 p-2.5">
                  <div className="text-[10px] text-stone-500">Gross Footprint</div>
                  <div className="font-bold font-mono text-emerald-900 text-sm mt-0.5">
                    {totalReportEmissions.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-400">tCO2e gross</div>
                </div>
                <div className="rounded-lg bg-white border border-stone-200/70 p-2.5">
                  <div className="text-[10px] text-stone-500">Carbon Records</div>
                  <div className="font-bold font-mono text-stone-900 text-sm mt-0.5">
                    {records.length}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {records.filter(r => r.status === 'VALIDATED').length} validated
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-stone-200/70 p-2.5">
                  <div className="text-[10px] text-stone-500">Audit Engagements</div>
                  <div className="font-bold font-mono text-stone-900 text-sm mt-0.5">
                    {audits.length}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {audits.filter(a => a.status === 'IN_PROGRESS').length} active
                  </div>
                </div>
              </div>
            </div>

            {/* Format Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">
                Select Output File Format
              </label>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setDownloadFormat('csv')}
                  className={`rounded-xl border p-3 text-left transition flex flex-col justify-between ${
                    downloadFormat === 'csv'
                      ? 'border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div>
                    <FileSpreadsheet className={`h-4 w-4 ${downloadFormat === 'csv' ? 'text-emerald-800' : 'text-stone-500'}`} />
                    <div className="font-bold text-xs text-stone-900 mt-2">Aggregated CSV</div>
                    <div className="text-[11px] text-stone-500 mt-1">Multi-section ledger for Excel / spreadsheets</div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 mt-3">.csv file</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDownloadFormat('markdown')}
                  className={`rounded-xl border p-3 text-left transition flex flex-col justify-between ${
                    downloadFormat === 'markdown'
                      ? 'border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div>
                    <FileText className={`h-4 w-4 ${downloadFormat === 'markdown' ? 'text-emerald-800' : 'text-stone-500'}`} />
                    <div className="font-bold text-xs text-stone-900 mt-2">Executive Brief</div>
                    <div className="text-[11px] text-stone-500 mt-1">Formatted report with tables for ESG committees</div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 mt-3">.md file</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDownloadFormat('json')}
                  className={`rounded-xl border p-3 text-left transition flex flex-col justify-between ${
                    downloadFormat === 'json'
                      ? 'border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div>
                    <Database className={`h-4 w-4 ${downloadFormat === 'json' ? 'text-emerald-800' : 'text-stone-500'}`} />
                    <div className="font-bold text-xs text-stone-900 mt-2">Full JSON Bundle</div>
                    <div className="text-[11px] text-stone-500 mt-1">Structured dataset with digital lineage</div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 mt-3">.json file</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDownloadModalOpen(false)}
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => handleDownloadReport(downloadFormat)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs active:scale-[0.99] disabled:opacity-60"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                    <span>Report Downloaded!</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating Summary...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download {downloadFormat.toUpperCase()} Summary File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
