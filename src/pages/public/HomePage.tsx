import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  ClipboardList,
  AlertTriangle,
  Flame,
  CheckSquare,
  FileSpreadsheet,
  Database,
  Lock,
  Layers,
  ChevronRight,
  BarChart3,
  Server,
  History,
  FileText,
  Activity,
  Cpu,
  Check,
  Compass,
  Building2,
  Globe2
} from 'lucide-react';
import { CarbonRoiCalculator } from '../../components/calculator/CarbonRoiCalculator';

interface HomePageProps {
  navigate: (path: string) => void;
}

export function HomePage({ navigate }: HomePageProps) {
  const [activeScopeTab, setActiveScopeTab] = useState<'all' | 'scope1' | 'scope2' | 'scope3'>('all');

  const scopeMetrics = {
    all: { total: '1,842.6', unit: 'tCO2e', variance: '-8.4%', status: 'Within Target', evidenceCount: '142 Files Verified' },
    scope1: { total: '412.3', unit: 'tCO2e', variance: '-4.1%', status: 'Natural Gas & Fleet', evidenceCount: '38 Bills & Manifests' },
    scope2: { total: '894.1', unit: 'tCO2e', variance: '-12.3%', status: 'Market-Based Grid', evidenceCount: '64 Utility Statements' },
    scope3: { total: '536.2', unit: 'tCO2e', variance: '+1.8%', status: 'Business Travel & Freight', evidenceCount: '40 Invoices & Expense Logs' }
  };

  const workflowSteps = [
    { num: '01', label: 'Primary Activity Data', desc: 'Meter readings, invoices & ERP telemetry', icon: Flame },
    { num: '02', label: 'Evidence Verification', desc: 'Utility bills & supplier certificates linked', icon: FileCheck2 },
    { num: '03', label: 'Formal Carbon Audit', desc: 'Independent protocol review & sample tests', icon: ClipboardList },
    { num: '04', label: 'Findings Triage', desc: 'Discrepancy logs with severity classifications', icon: AlertTriangle },
    { num: '05', label: 'Corrective Action (CAPA)', desc: 'Task delegation, SLAs & remediation evidence', icon: CheckSquare },
    { num: '06', label: 'Compliance & Disclosure', desc: 'GHG Protocol, CSRD & ISO 14064 alignment', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 lg:pt-24">
        {/* Subtle background ambient mesh */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div 
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-200 to-teal-100 opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" 
            style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Quiet Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-emerald-800 uppercase">
            <span>Enterprise Carbon Accounting</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>ISO 14064-3 Assurance Ready</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>CSRD ESRS E1 Compliant</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] max-w-5xl mx-auto" style={{ textWrap: 'balance' }}>
            Authoritative Carbon Intelligence. <br className="hidden sm:inline" />
            <span className="text-emerald-700">Audit-Proof from Source to Disclosure.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Eliminate compliance liability. Centralize carbon accounting, primary evidence ledgers, auditor verification, and corrective action workflows in a unified, SQL-backed enterprise platform.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/sign-in')}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.99]"
            >
              <span>Launch Enterprise Workspace</span>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => navigate('/how-it-works')}
              className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Explore Audit Methodology
            </button>
          </div>

          {/* Social Proof Industry Bar */}
          <div className="mt-14 border-y border-slate-200/80 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="text-slate-400">Deployed Across Critical Sectors:</span>
              <span className="flex items-center gap-1.5 text-slate-700"><Building2 className="h-3.5 w-3.5 text-emerald-600" /> Energy & Grid Infrastructure</span>
              <span className="flex items-center gap-1.5 text-slate-700"><Cpu className="h-3.5 w-3.5 text-emerald-600" /> Semiconductor Manufacturing</span>
              <span className="flex items-center gap-1.5 text-slate-700"><Compass className="h-3.5 w-3.5 text-emerald-600" /> Global Intermodal Logistics</span>
              <span className="flex items-center gap-1.5 text-slate-700"><Server className="h-3.5 w-3.5 text-emerald-600" /> Hyperscale Cloud Centers</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Telemetry Preview Showcase */}
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
            {/* Top Bar of Preview */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-3.5 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-300"></span>
                  <span className="h-3 w-3 rounded-full bg-slate-300"></span>
                  <span className="h-3 w-3 rounded-full bg-slate-300"></span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600">
                  carbonflow://org/acme-corp/reporting-period/2025/emissions-ledger
                </span>
              </div>

              {/* Interactive Scope Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
                {(['all', 'scope1', 'scope2', 'scope3'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveScopeTab(tab)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeScopeTab === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'all' ? 'All Scopes' : tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Inner Interactive Cockpit Display */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Metric Hero Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Verified Emissions</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                      {scopeMetrics[activeScopeTab].total}
                    </span>
                    <span className="text-sm font-semibold text-slate-600">{scopeMetrics[activeScopeTab].unit}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-emerald-700 font-bold font-mono">{scopeMetrics[activeScopeTab].variance}</span>
                    <span className="text-slate-500">vs 2024 Base Year</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Evidence Status</span>
                    <span className="font-semibold text-slate-900">{scopeMetrics[activeScopeTab].evidenceCount}</span>
                  </div>
                </div>

                {/* Scope Breakdown Strip */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Protocol Allocation & Factor Registry</span>
                    <span className="text-xs font-mono text-emerald-700 font-medium">EPA / DEFRA v2025</span>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">Scope 1 (Stationary Combustion & Mobile)</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">412.3 tCO2e (22.4%)</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '22.4%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">Scope 2 (Purchased Electricity & Steam)</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">894.1 tCO2e (48.5%)</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '48.5%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">Scope 3 (Upstream Freight, Business Travel)</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">536.2 tCO2e (29.1%)</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: '29.1%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Readiness Gauge */}
                <div className="rounded-xl border border-slate-200 bg-emerald-50/40 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Assurance Status
                    </div>
                    <div className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                      94.8% <span className="text-xs font-medium text-slate-600 font-sans">Readiness</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-snug">
                      Primary evidence ledger attached to 98% of recorded emissions entries. Ready for ISO 14064 sample testing.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/sign-in')}
                    className="mt-4 w-full rounded-lg bg-emerald-700 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
                  >
                    Open Live Audit Trail
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Methodology Workflow */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Operational Discipline</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            The Audit & Traceability Lifecycle
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            From raw utility invoice collection to external auditor sign-off. Every calculation step is preserved, reproducible, and verifiable.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold">
                    <span>{step.num}</span>
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900 leading-snug">{step.label}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Problem vs Enterprise Solution */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Legacy Vulnerability */}
          <div className="rounded-2xl border border-rose-200/90 bg-rose-50/30 p-8 sm:p-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              The Legacy Compliance Risk
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">Spreadsheet Chaos & Greenwashing Liability</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Global enterprises face severe regulatory fines and reputational blowback because their carbon reports rely on untraceable manual spreadsheets:
            </p>
            <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">✕</span>
                <span>Unverified spreadsheet formulas with undocumented assumptions and overwritten cells</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">✕</span>
                <span>Fuel manifests, utility statements, and REC certificates scattered across decentralized inboxes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">✕</span>
                <span>Audit non-conformities documented in passive PDF notes that fail to enforce accountability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-600 font-bold">✕</span>
                <span>High vulnerability during mandatory CSRD, SEC Climate, and ISO 14064 limited assurance reviews</span>
              </li>
            </ul>
          </div>

          {/* The CarbonFlow Standard */}
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/30 p-8 sm:p-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              The CarbonFlow Standard
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">Authoritative, SQL-Backed Audit Ledger</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              CarbonFlow serves as the single source of truth linking every calculated gram of CO2 directly to its primary source documentation:
            </p>
            <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="font-mono text-emerald-700 font-bold">✓</span>
                <span>Transparent calculation math: <code className="bg-emerald-100/70 px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-emerald-900">activity_qty × emission_factor = tCO2e</code></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-emerald-700 font-bold">✓</span>
                <span>Centralized Evidence Vault linking invoices, smart meter logs, and fuel delivery receipts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-emerald-700 font-bold">✓</span>
                <span>Structured audit lifecycles with line-by-line verification, discrepancy logs, and CAPA resolution</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-emerald-700 font-bold">✓</span>
                <span>Strict multi-tenant isolation, immutable audit trails, and role-based access for auditors and admins</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Asymmetric Core Capabilities Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Comprehensive Architecture</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Engineered for Stringent Regulatory Oversight
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            A cohesive suite of capabilities engineered for corporate sustainability officers, internal ESG controllers, and accredited verification bodies.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Carbon Accounting */}
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Scope 1, 2, and 3 Accounting</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Standardized emission factor repositories (EPA GHG Hub, UK DEFRA, IEA Grid Factors). Automatic market-based and location-based calculations with full audit provenance.
            </p>
          </div>

          {/* Card 2: Primary Evidence Vault */}
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Primary Evidence Ledger</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Tamper-evident document repository linking utility invoices, fuel bills, and flight manifests directly to carbon activity items with verification timestamps.
            </p>
          </div>

          {/* Card 3: Audit Lifecycle Management */}
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Structured Audit Workflows</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Formal audit stages (Draft, Scheduled, In Progress, Under Review, Closed) with line-by-line item verification, sample testing, and auditor attestation logs.
            </p>
          </div>

          {/* Card 4: Findings Triage */}
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Findings & Severity Triage</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Structured categorization of discrepancies by severity (Critical, High, Medium, Low) with root cause documentation and direct links to affected emission records.
            </p>
          </div>

          {/* Card 5: Corrective Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Corrective Action Remediation (CAPA)</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Enforce accountability with assigned owners, deadlines, priority levels, and closure evidence to remediate findings ahead of external regulatory deadlines.
            </p>
          </div>

          {/* Card 6: Multi-Framework Compliance */}
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Multi-Framework Compliance Hub</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Real-time compliance status tracking for GHG Protocol Corporate Standard, ISO 14064-1, CSRD ESRS E1, SEC Climate Disclosure, and California SB 253.
            </p>
          </div>
        </div>
      </section>

      {/* Enterprise Verification Engine Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Deterministic Calculation Engine</span>
              </div>
              <h3 className="mt-3 text-3xl font-extrabold text-white">Audit-Grade Lineage & Verifiable Math</h3>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                CarbonFlow replaces opaque estimations with transparent, deterministic GHG Protocol formulas. Every metric—from fuel combustion to grid electricity—is bound to verified emission factors and tamper-evident evidence dossiers.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Zero Black-Box Math</span>
                  </div>
                  <p className="mt-1.5 text-slate-400 leading-normal">
                    Every formula is 100% auditable and reproducible with explicit factor versioning (DEFRA 2025, EPA GHG Hub, IEA).
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Cryptographic Evidence Lineage</span>
                  </div>
                  <p className="mt-1.5 text-slate-400 leading-normal">
                    Primary source documents are verified with SHA-256 checksums and immutable audit logging for third-party assurance.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Layers className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-Tier Dual Attestation</span>
                  </div>
                  <p className="mt-1.5 text-slate-400 leading-normal">
                    Strict segregation of duties across Analysts, Sustainability Managers, and External Assurance Auditors.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Live Discrepancy Prevention</span>
                  </div>
                  <p className="mt-1.5 text-slate-400 leading-normal">
                    Real-time boundary checks, unit normalization, and automated CAPA remediation for disclosure compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Verifiable Emission Pipeline Interactive Visual Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-5 sm:p-6 text-xs text-slate-300 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
                    Live Audit Verification Pipeline
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  ISO 14064-3 ASSURED
                </span>
              </div>

              {/* Sample Activity Trace */}
              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-medium">Activity Stream Input</div>
                  <div className="mt-1 text-slate-200 font-semibold flex items-center justify-between">
                    <span>Stationary Combustion • Facility #4 (Natural Gas)</span>
                    <span className="text-emerald-400 font-mono">Scope 1</span>
                  </div>
                  <div className="mt-1 text-slate-400 text-[10px]">
                    Quantity: <span className="text-white font-medium">42,500.00 m³</span> • Meter: <span className="text-slate-300">SM-NG-9481</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-medium">Factor Provenance Registry</div>
                  <div className="mt-1 text-slate-200 font-semibold flex items-center justify-between">
                    <span>EPA GHG Hub 2024 / DEFRA Standard</span>
                    <span className="text-cyan-400 text-[10px]">Factor ID: EF-S1-002</span>
                  </div>
                  <div className="mt-1 text-slate-400 text-[10px]">
                    Factor: <span className="text-white font-medium">2.0300 kg CO₂e / m³</span> (0.002030 tCO₂e/m³)
                  </div>
                </div>

                <div className="bg-emerald-950/30 rounded-lg p-3 border border-emerald-900/40">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-500 font-sans font-medium">Deterministic Calculation Output</div>
                  <div className="mt-1 text-slate-200 flex items-center justify-between">
                    <span>42,500.00 m³ × 0.002030 tCO₂e/m³</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">86.275 tCO₂e</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-medium">Evidence Cryptographic Attestation</div>
                  <div className="mt-1 text-slate-300 flex items-center justify-between">
                    <span className="truncate max-w-[220px]">utility_meter_billing_q1_2025.pdf</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">✓ SHA-256 Matched</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 truncate font-mono">
                    Hash: 8f4a3c...e92b11d (Tamper Proof)
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Dual sign-off recorded</span>
                </div>
                <span className="text-emerald-400 font-semibold">100% Audit-Proof Reconciliation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Carbon ROI & Cost Savings Calculator */}
      <CarbonRoiCalculator onNavigate={navigate} />

      {/* Executive Call to Action */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-10 sm:p-14 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Ready for External Assurance</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Make Your Carbon Disclosures Audit-Proof Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-600">
            Experience the platform trusted for rigorous compliance. Launch the interactive demo workspace or configure your enterprise organization.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/sign-in')}
              className="w-full sm:w-auto rounded-lg bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.99]"
            >
              Sign In to Demo Workspace
            </button>
            <button
              onClick={() => navigate('/get-started')}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Register Organization
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
