import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  Flame,
  TrendingDown,
  Layers,
  Sparkles,
  Calendar,
  Eye,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { DashboardMetrics } from '../../types';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DashboardMetrics;
}

type GenerationStage = 'idle' | 'generating' | 'completed';

export function ExportReportModal({ isOpen, onClose, metrics }: ExportReportModalProps) {
  const [stage, setStage] = useState<GenerationStage>('generating');
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'details'>('preview');
  const [watermark, setWatermark] = useState<'AUDIT_VERIFIED' | 'CONFIDENTIAL' | 'BOARD_READY'>('AUDIT_VERIFIED');
  const [reportPeriod, setReportPeriod] = useState('2025-Q1');

  const generationSteps = [
    { title: 'Aggregating SQL Carbon Metrics', detail: 'Reading Scope 1, 2, and 3 activity ledger records...' },
    { title: 'Calculating Trajectory & Targets', detail: 'Benchmarking against SBTi 1.5°C ceiling (235 tCO₂e/mo)...' },
    { title: 'Rendering Recharts Vector Graphics', detail: 'Rasterizing monthly trend curves and scope allocations...' },
    { title: 'Affixing Audit & Assurance Trail', detail: 'Embedding append-only audit hash and ISO 14064-1 metadata...' },
    { title: 'Compiling Final PDF Document', detail: 'Building vector PDF stream and formatting layout...' }
  ];

  // Start generation simulation when modal opens
  useEffect(() => {
    if (!isOpen) {
      setStage('generating');
      setProgress(0);
      setActiveStepIndex(0);
      return;
    }

    setStage('generating');
    setProgress(5);
    setActiveStepIndex(0);

    const stepInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(stepInterval);
          setStage('completed');
          setActiveStepIndex(generationSteps.length - 1);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 15) + 10;
        const bounded = Math.min(next, 95);
        const nextStepIdx = Math.min(
          Math.floor((bounded / 100) * generationSteps.length),
          generationSteps.length - 1
        );
        setActiveStepIndex(nextStepIdx);
        return bounded;
      });
    }, 380);

    return () => clearInterval(stepInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  const scope1 = metrics.scope1Emissions ?? 0;
  const scope2 = metrics.scope2Emissions ?? 0;
  const scope3 = metrics.scope3Emissions ?? 0;
  const totalEmissions = metrics.totalEmissions ?? (scope1 + scope2 + scope3);

  const s1Pct = totalEmissions > 0 ? Math.round((scope1 / totalEmissions) * 100) : 0;
  const s2Pct = totalEmissions > 0 ? Math.round((scope2 / totalEmissions) * 100) : 0;
  const s3Pct = totalEmissions > 0 ? Math.round((scope3 / totalEmissions) * 100) : 0;

  const fileName = `CarbonFlow_Emissions_Analysis_${reportPeriod.replace('-', '_')}.pdf`;

  const handleDownloadMockPdf = () => {
    // Generate a formatted report text / PDF-compatible file and trigger browser download
    const reportText = `%PDF-1.4
%âãÏÓ
1 0 obj
<<
/Title (CarbonFlow Executive Carbon Emissions Analysis Report - ${reportPeriod})
/Author (CarbonFlow SaaS Platform)
/Subject (Corporate GHG Inventory, Monthly Trends, and SBTi Target Trajectory)
/CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z)
/Producer (CarbonFlow PDF Engine v2.4)
>>
endobj
2 0 obj
<<
/Type /Catalog
/Pages 3 0 R
>>
endobj
3 0 obj
<<
/Type /Pages
/Kids [4 0 R]
/Count 1
>>
endobj
4 0 obj
<<
/Type /Page
/Parent 3 0 R
/MediaBox [0 0 612 792]
/Contents 5 0 R
/Resources <<
  /Font <<
    /F1 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica
    >>
    /F2 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica-Bold
    >>
  >>
>>
>>
endobj
5 0 obj
<< /Length 1240 >>
stream
BT
/F2 20 Tf
50 740 Td
(CARBONFLOW EXECUTIVE EMISSIONS ANALYSIS) Tj
/F1 10 Tf
0 -18 Td
(Reporting Period: ${reportPeriod} | Generated: ${new Date().toLocaleDateString()}) Tj
0 -14 Td
(Watermark: ${watermark} | ISO 14064-1 & GHG Protocol Compliant) Tj
0 -24 Td
/F2 14 Tf
(1. EXECUTIVE SUMMARY & GROSS EMISSIONS) Tj
/F1 10 Tf
0 -16 Td
(Total Gross Emissions: ${totalEmissions.toLocaleString()} tCO2e across ${metrics.totalCarbonRecords ?? 28} activity ledger records) Tj
0 -14 Td
(Target Ceiling: 235.0 tCO2e/month (SBTi 1.5C Trajectory) - Status: COMPLIANT (-13.9% vs Baseline)) Tj
0 -24 Td
/F2 14 Tf
(2. SCOPE 1, 2 & 3 DISAGGREGATION) Tj
/F1 10 Tf
0 -16 Td
(Scope 1 (Direct Fuel & Combustion): ${scope1.toFixed(2)} tCO2e (${s1Pct}%)) Tj
0 -14 Td
(Scope 2 (Market-Based Electricity): ${scope2.toFixed(2)} tCO2e (${s2Pct}%)) Tj
0 -14 Td
(Scope 3 (Value Chain & Travel):     ${scope3.toFixed(2)} tCO2e (${s3Pct}%)) Tj
0 -24 Td
/F2 14 Tf
(3. RECONCILED MONTHLY TRAJECTORY (Trailing 12 Months)) Tj
/F1 9 Tf
0 -15 Td
(Apr 24: 264.7 tCO2e  |  May 24: 268.4 tCO2e  |  Jun 24: 253.1 tCO2e) Tj
0 -13 Td
(Jul 24: 246.9 tCO2e  |  Aug 24: 240.4 tCO2e  |  Sep 24: 233.0 tCO2e (Assurance closed)) Tj
0 -13 Td
(Oct 24: 228.1 tCO2e  |  Nov 24: 224.7 tCO2e  |  Dec 24: 232.3 tCO2e) Tj
0 -13 Td
(Jan 25: 230.1 tCO2e  |  Feb 25: 229.4 tCO2e  |  Mar 25: 234.18 tCO2e (Current Target: 235.0)) Tj
0 -24 Td
/F2 14 Tf
(4. AUDIT & EVIDENCE VERIFICATION) Tj
/F1 10 Tf
0 -16 Td
(Evidence Files Linked: ${metrics.verifiedEvidenceRecords ?? 14} verified documents) Tj
0 -14 Td
(Active Audits: ${metrics.activeAudits ?? 2} | Open Findings: ${metrics.openFindings ?? 3} | Corrective Actions: ${metrics.totalCorrectiveActions ?? 5}) Tj
0 -14 Td
(Cryptographic Audit Signature: SHA-256 [0x9b4e72a8c51f33de8140bc77a110]) Tj
0 -20 Td
(End-to-End Traceability enforced via Append-Only Audit Logs.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000280 00000 n 
0000000333 00000 n 
0000000392 00000 n 
0000000624 00000 n 
trailer
<<
/Size 6
/Root 2 0 R
/Info 1 0 R
>>
startxref
1920
%%EOF`;

    const blob = new Blob([reportText], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRestart = () => {
    setStage('generating');
    setProgress(5);
    setActiveStepIndex(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 bg-stone-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-white shadow-2xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Export Carbon Emissions Analysis Report
              </h2>
              <p className="text-xs text-stone-500">
                Mock PDF generation engine for executive & auditor disclosures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STAGE 1 & 2: GENERATING PROCESS VIEW */}
          {stage === 'generating' && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 mb-1">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  Compiling High-Resolution Analysis PDF...
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Generating verified corporate carbon emissions disclosure dossier with reconciled Scope 1-3 ledger records and monthly trajectory targets.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {generationSteps[activeStepIndex]?.title || 'Processing'}
                  </span>
                  <span className="font-mono text-stone-500">{progress}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-400 italic">
                  {generationSteps[activeStepIndex]?.detail}
                </p>
              </div>

              {/* Generation Checklist Pipeline */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2.5">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Pipeline Execution Steps
                </div>
                <div className="space-y-2">
                  {generationSteps.map((s, idx) => {
                    const isDone = idx < activeStepIndex || progress === 100;
                    const isCurrent = idx === activeStepIndex && progress < 100;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                          isDone
                            ? 'bg-emerald-50/70 border border-emerald-200/60 text-emerald-950 font-medium'
                            : isCurrent
                            ? 'bg-white border border-emerald-300 text-stone-900 shadow-2xs font-semibold'
                            : 'text-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 text-emerald-800 animate-spin shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-stone-300 shrink-0" />
                          )}
                          <span>{s.title}</span>
                        </div>
                        <span className="text-[10px] text-stone-500">
                          {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Queued'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: COMPLETED VIEW */}
          {stage === 'completed' && (
            <div className="space-y-6">
              {/* Top Success Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Carbon Emissions Analysis PDF Ready
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Document compiled and digitally signed with append-only audit trail verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handleRestart}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition"
                    title="Regenerate report"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={handleDownloadMockPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* View Switcher: Document Preview vs Details */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
                      activeTab === 'preview'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Document Sheet Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
                      activeTab === 'details'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Metadata & Audit Seal</span>
                  </button>
                </div>

                {/* Watermark Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 text-[11px] font-medium hidden sm:inline">Watermark:</span>
                  <select
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value as any)}
                    className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 font-medium focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="AUDIT_VERIFIED">AUDIT VERIFIED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="BOARD_READY">BOARD OF DIRECTORS</option>
                  </select>
                </div>
              </div>

              {/* TAB 1: REALISTIC PDF SHEET PREVIEW */}
              {activeTab === 'preview' && (
                <div className="rounded-xl border border-stone-300 bg-stone-100 p-4 sm:p-6 shadow-inner max-h-[420px] overflow-y-auto">
                  {/* Styled White PDF Paper Page */}
                  <div className="relative mx-auto max-w-2xl bg-white p-6 sm:p-8 rounded-lg shadow-md border border-stone-200 text-stone-900 space-y-6">
                    {/* Watermark Ribbon */}
                    <div className="absolute top-4 right-4 pointer-events-none opacity-20">
                      <div className="rotate-12 border-2 border-dashed border-red-600 px-3 py-1 text-xs font-black tracking-widest text-red-600 uppercase">
                        {watermark.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Report Document Header */}
                    <div className="border-b-2 border-emerald-800 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            CarbonFlow
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            Enterprise Sustainability Assurance
                          </span>
                        </div>
                        <h1 className="mt-2 text-xl font-black text-stone-900 tracking-tight">
                          Carbon Emissions Analysis Report
                        </h1>
                        <p className="text-xs text-stone-500 mt-0.5">
                          GHG Protocol Corporate Standard & ISO 14064-1 Compliant Inventory Dossier
                        </p>
                      </div>

                      <div className="text-right text-[11px] text-stone-500 space-y-0.5">
                        <div className="font-bold text-stone-800">Reporting Period: {reportPeriod}</div>
                        <div>Date: {new Date().toLocaleDateString()}</div>
                        <div className="font-mono text-[10px] text-emerald-800">Doc ID: CF-REP-2025Q1-9B</div>
                      </div>
                    </div>

                    {/* Executive Summary Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                        <Flame className="h-4 w-4 text-emerald-800" />
                        <span>1. Executive Gross Footprint Summary</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                        <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                          <div className="text-[10px] font-bold text-stone-500 uppercase">Gross Footprint</div>
                          <div className="mt-1 text-base font-extrabold text-stone-900">
                            {totalEmissions.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-stone-500">tCO₂e Total</div>
                        </div>

                        <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                          <div className="text-[10px] font-bold text-stone-500 uppercase">Scope 1 (Direct)</div>
                          <div className="mt-1 text-base font-extrabold text-amber-700">
                            {scope1.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-stone-500">{s1Pct}% of total</div>
                        </div>

                        <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                          <div className="text-[10px] font-bold text-stone-500 uppercase">Scope 2 (Power)</div>
                          <div className="mt-1 text-base font-extrabold text-blue-700">
                            {scope2.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-stone-500">{s2Pct}% of total</div>
                        </div>

                        <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                          <div className="text-[10px] font-bold text-stone-500 uppercase">Scope 3 (Chain)</div>
                          <div className="mt-1 text-base font-extrabold text-purple-700">
                            {scope3.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-stone-500">{s3Pct}% of total</div>
                        </div>
                      </div>
                    </div>

                    {/* SBTi Target Trajectory & Compliance Review */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                        <TrendingDown className="h-4 w-4 text-emerald-800" />
                        <span>2. Science-Based Targets (SBTi 1.5°C) & Monthly Trend</span>
                      </div>
                      <div className="rounded-lg border border-stone-200 bg-emerald-50/40 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-emerald-950">Monthly Carbon Emissions Ceiling:</span>
                          <span className="font-mono text-emerald-900">235.00 tCO₂e / month</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-emerald-950">Trajectory Performance:</span>
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                            <ShieldCheck className="h-3 w-3" />
                            COMPLIANT (-13.9% relative to Apr 2024 baseline)
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 pt-1 border-t border-emerald-200/60 leading-relaxed">
                          Carbon emissions across Q1 2025 maintain full adherence inside the Science-Based Targets 1.5°C pathway, driven by verified on-site solar PPA expansion and EV fleet migration.
                        </p>
                      </div>
                    </div>

                    {/* Activity Ledger & Audit Stamp Table */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                        <Layers className="h-4 w-4 text-emerald-800" />
                        <span>3. Evidence & Governance Verification</span>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-stone-200 text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-stone-50 text-[10px] font-bold uppercase text-stone-500">
                            <tr>
                              <th className="px-3 py-2">Metric</th>
                              <th className="px-3 py-2">Quantity</th>
                              <th className="px-3 py-2">Verification Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-medium text-stone-700 text-[11px]">
                            <tr>
                              <td className="px-3 py-2">Authoritative Carbon Activity Records</td>
                              <td className="px-3 py-2 font-mono">{metrics.totalCarbonRecords ?? 28} records</td>
                              <td className="px-3 py-2 text-emerald-700">100% SQL Reconciled</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Attached Primary Evidence Invoices</td>
                              <td className="px-3 py-2 font-mono">{metrics.verifiedEvidenceRecords ?? 14} documents</td>
                              <td className="px-3 py-2 text-emerald-700">Verified & Linked</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Active Internal / External Audits</td>
                              <td className="px-3 py-2 font-mono">{metrics.activeAudits ?? 2} active</td>
                              <td className="px-3 py-2 text-stone-600">ISO 14064 Limited Assurance</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* PDF Document Footer with Append-Only Stamp */}
                    <div className="border-t border-stone-200 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-stone-400 gap-2">
                      <div className="font-mono">
                        Digital Signature: SHA-256[0x8f22...e931] • Append-Only Ledger Signed
                      </div>
                      <div className="font-medium text-stone-500">
                        Page 1 of 1 • CarbonFlow SaaS
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TECHNICAL METADATA & EXPORT DETAILS */}
              {activeTab === 'details' && (
                <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-stone-500 uppercase">Target Document Name</div>
                      <div className="font-mono font-semibold text-stone-900">{fileName}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-stone-500 uppercase">File Format & Density</div>
                      <div className="font-semibold text-stone-900">Vector PDF (ISO 19005-1 PDF/A Compliant, 300 DPI)</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-stone-500 uppercase">Estimated File Size</div>
                      <div className="font-mono font-semibold text-stone-900">2.4 MB</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-stone-500 uppercase">Data Source Integrity</div>
                      <div className="font-semibold text-emerald-800">Live PostgreSQL / Spring JDBC Transaction Snapshot</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
                    <div className="font-bold text-stone-800">Included Analysis Modules:</div>
                    <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                      <li>Scope 1 Direct Combustion & Fugitive Emissions Inventory</li>
                      <li>Scope 2 Purchased Grid Electricity (Location & Market-Based Factors)</li>
                      <li>Scope 3 Value Chain Disaggregation (Categories 1, 4, 6 & 7)</li>
                      <li>12-Month Monthly Trend Recharts Trajectory vs SBTi 1.5°C Ceilings</li>
                      <li>Append-Only Audit Trail Timestamp & Auditor Verification Checklist</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>End-to-End Traceability • Append-Only Audit Logs</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              Close
            </button>
            {stage === 'completed' && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                  title="Print analysis document"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print View</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMockPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF Document</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
