import React from 'react';
import {
  Flame,
  FileCheck2,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  FileSpreadsheet,
  History,
  Lock,
  DatabaseBackup,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FeaturesPageProps {
  navigate: (path: string) => void;
}

export function FeaturesPage({ navigate }: FeaturesPageProps) {
  const features = [
    {
      num: '01',
      title: 'Carbon Data Management',
      icon: Flame,
      summary: 'Deterministic Scope 1, 2, and 3 Emissions Ledger',
      details: [
        'Stores activity quantity, unit, and selected emission factor explicitly.',
        'Calculates emissions transparently (activity × factor = emissions) without black-box alterations.',
        'Supports comprehensive EPA, DEFRA, and IEA factor libraries with year-version tracking.',
        'Filterable by period, scope, category, and operational facility.'
      ]
    },
    {
      num: '02',
      title: 'Evidence Management',
      icon: FileCheck2,
      summary: 'Secure File Storage Linked Directly to Activities',
      details: [
        'Organizes invoices, meter statements, fuel card logs, and REC certificates.',
        'Supports status lifecycles: Pending, Verified, Rejected, and Expired.',
        'Directly connects each document to its corresponding carbon record and audit engagement.',
        'Prevents unauthenticated public URL leaks through tenant boundary controls.'
      ]
    },
    {
      num: '03',
      title: 'Carbon Audit Management',
      icon: ClipboardList,
      summary: 'Structured Lifecycle for Internal & 3rd-Party Audits',
      details: [
        'Workflow transitions: Draft → Scheduled → In Progress → Under Review → Completed → Closed.',
        'Scopes audits to defined inventory periods and greenhouse gas protocols.',
        'Provides lead auditor assignments and enforceable due dates.',
        'Maintains append-only closeout summaries and completion notes.'
      ]
    },
    {
      num: '04',
      title: 'Validation Engine',
      icon: CheckCircle2,
      summary: 'Line-by-Line Auditor Verification & Sign-off',
      details: [
        'Allows authorized auditors to review each carbon transaction individually.',
        'Captures reviewer identity, timestamp, validation verdict, and explanatory comments.',
        'Automatically updates parent inventory status (Validated, Flagged, Needs Review).',
        'Provides end-to-end evidentiary traceability before formal disclosure.'
      ]
    },
    {
      num: '05',
      title: 'Findings Management',
      icon: AlertTriangle,
      summary: 'Non-Compliance Detection & Severity Classification',
      details: [
        'Triage findings into Low, Medium, High, and Critical severity classes.',
        'Directly links issues to underlying carbon entries, evidence documents, and parent audits.',
        'Identifies root causes (e.g. missing technician license, estimation variances).',
        'Status tracking: Open, In Progress, Resolved, Accepted Risk, Closed.'
      ]
    },
    {
      num: '06',
      title: 'Corrective Actions (CAPA)',
      icon: CheckSquare,
      summary: 'Closed-Loop Remediation & Overdue Alerts',
      details: [
        'Assigns specific remediation owners with hard calendar due dates.',
        'Flags overdue corrective actions automatically in dashboards and notifications.',
        'Requires completion notes and supporting documentation before verification.',
        'Separates task completion from managerial verification for audit independence.'
      ]
    },
    {
      num: '07',
      title: 'Compliance Tracking',
      icon: ShieldCheck,
      summary: 'Cross-Framework Readiness & Gap Analysis',
      details: [
        'Supports GHG Protocol Corporate Standard, ISO 14064-1, CSRD ESRS E1, SEC Climate Rules, and CA SB 253.',
        'Tracks applicability (Mandatory, Voluntary, Under Evaluation) and compliance status.',
        'Maps mandatory disclosure requirements to verified evidence attachments.',
        'Maintains clear disclaimers that legal compliance responsibility remains with the reporting entity.'
      ]
    },
    {
      num: '08',
      title: 'Reporting & Disclosures',
      icon: FileSpreadsheet,
      summary: 'SQL-Aggregated Summaries & CSV Exports',
      details: [
        'Aggregates carbon totals, scope breakdowns, and audit status directly in SQL.',
        'Exports raw transaction ledgers to CSV for independent auditor verification.',
        'Generates printable executive status summaries with clear metric breakdowns.',
        'Zero hardcoded mock statistics—always synchronized with database state.'
      ]
    },
    {
      num: '09',
      title: 'Audit History',
      icon: Layers,
      summary: 'Historical Record Comparison & Multi-Year Trends',
      details: [
        'Maintains historical snapshots of prior reporting years without data drift.',
        'Enables year-over-year emissions comparisons to verify decarbonization trajectories.',
        'Stores completed audit packages as historical append-only archives.',
        'Preserves historical emission factor snapshots applied during original inventory years.'
      ]
    },
    {
      num: '10',
      title: 'Tamper-Evident Audit Trail',
      icon: History,
      summary: 'Append-Only Ledger of Every Platform Event',
      details: [
        'Logs actor identity, email, action type, entity ID, metadata JSON, and IP address.',
        'Records all authentication logins, data changes, evidence reviews, and role edits.',
        'Append-only database design strictly inaccessible to normal modification.',
        'Filterable by entity type and date range for forensic audit reviews.'
      ]
    },
    {
      num: '11',
      title: 'Role-Based Access Control',
      icon: Lock,
      summary: 'Enforced in Java Backend for Least Privilege',
      details: [
        'Preconfigured roles: Company Admin, Sustainability Manager, Analyst, and Employee.',
        'Backend authorization checked on every API route via Spring Security method annotations.',
        'Strict tenant context isolation preventing cross-organization data leakage.',
        'No dangerous super admin backdoors.'
      ]
    },
    {
      num: '12',
      title: 'Backup & Disaster Recovery',
      icon: DatabaseBackup,
      summary: 'Transparent Schema Snapshots & Recovery Runbooks',
      details: [
        'Inspects live Flyway schema migration history directly from the database.',
        'Provides honest documentation of infrastructure-level PITR (Point-in-Time Recovery).',
        'Exports complete organization data packages on demand.',
        'Provides verified RTO (<15 min) and RPO (<5 min) operational runbooks.'
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Complete Feature Breakdown</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          12 Core Capabilities of CarbonFlow
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Engineered to satisfy the stringent verification requirements of ISO 14064 assurance auditors and statutory CSRD inspectors.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.num} className="rounded-xl border border-stone-200 bg-white p-7 shadow-xs hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-400">{f.num}</span>
                    <h3 className="text-lg font-bold text-stone-900">{f.title}</h3>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-emerald-800 uppercase tracking-wide">{f.summary}</p>
              <ul className="mt-4 space-y-2 text-xs text-stone-600">
                {f.details.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <button
          onClick={() => navigate('/how-it-works')}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 transition"
        >
          <span>See How It Works in Practice</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
