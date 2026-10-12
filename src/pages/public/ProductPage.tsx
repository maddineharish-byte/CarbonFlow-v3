import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Flame,
  FileCheck2,
  ClipboardList,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  FileSpreadsheet,
  History,
  DatabaseBackup,
  Settings,
  ArrowRight
} from 'lucide-react';

interface ProductPageProps {
  navigate: (path: string) => void;
}

export function ProductPage({ navigate }: ProductPageProps) {
  const modules = [
    {
      title: 'Executive Dashboard',
      icon: LayoutDashboard,
      desc: 'Real-time aggregated view of gross carbon footprint across Scope 1, 2, and 3, audit milestone statuses, open findings severity, and compliance posture derived from direct SQL aggregations.'
    },
    {
      title: 'Organization Governance',
      icon: Building2,
      desc: 'Corporate boundary definitions, reporting cycles, baseline parameters, and multi-facility organizational structures.'
    },
    {
      title: 'Users & Role-Based Permissions',
      icon: Users,
      desc: 'Enforce principle of least privilege across Company Admins, Sustainability Managers, Analysts, and Employees with complete tenant-level isolation.'
    },
    {
      title: 'Carbon Data Management',
      icon: Flame,
      desc: 'Log activity data (therms, kWh, gallons, passenger-km), bind recognized emission factors (EPA, DEFRA, IEA), and store deterministic calculations.'
    },
    {
      title: 'Evidence Repository',
      icon: FileCheck2,
      desc: 'Centralize utility invoices, diesel transaction receipts, supplier environmental declarations, and renewable energy certificates directly linked to emission records.'
    },
    {
      title: 'Carbon Audits & Validation',
      icon: ClipboardList,
      desc: 'Manage audit engagements from draft scoping to formal completion with line-by-line validation, reviewer notes, and assurance status tracking.'
    },
    {
      title: 'Findings Management',
      icon: AlertTriangle,
      desc: 'Identify discrepancies, missing contractor certifications, and calculation gaps with severity ratings (Low, Medium, High, Critical) and root cause logging.'
    },
    {
      title: 'Corrective Actions (CAPA)',
      icon: CheckSquare,
      desc: 'Drive remediation accountability with designated assignees, completion deadlines, priority rankings, and resolution evidence attachments.'
    },
    {
      title: 'Compliance Tracking',
      icon: ShieldCheck,
      desc: 'Map emissions inventories and evidentiary files to GHG Protocol standards, ISO 14064-1, CSRD ESRS E1, SEC rules, and California SB 253.'
    },
    {
      title: 'Reports & Disclosures',
      icon: FileSpreadsheet,
      desc: 'Generate executive summaries, scope-by-scope breakdowns, and audit trace matrices with reliable CSV exports.'
    },
    {
      title: 'Append-Only Audit Trail',
      icon: History,
      desc: 'Tamper-evident append-only ledger tracking all authentication events, record modifications, evidence verifications, and permission updates.'
    },
    {
      title: 'Backup & Recovery',
      icon: DatabaseBackup,
      desc: 'Transparent schema snapshot inspection, Flyway migration version logs, point-in-time recovery specifications, and disaster recovery runbooks.'
    },
    {
      title: 'Workspace Settings',
      icon: Settings,
      desc: 'Notification delivery triggers, profile credential security, and custom emission factor preferences.'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">CarbonFlow Architecture</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          The 13 Core Modules of the CarbonFlow Platform
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Designed specifically to replace scattered utility emails, unverified spreadsheets, and disconnected audit comments with a single authoritative system of record.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.title} className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-stone-900">{m.title}</h3>
                <p className="mt-2 text-xs text-stone-600 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Experience All Modules Live in the Sandbox</h2>
        <p className="mt-2 text-sm text-stone-600 max-w-xl mx-auto">
          Sign into our preloaded demo workspace to test each module with real SQL data across all 4 user roles.
        </p>
        <button
          onClick={() => navigate('/sign-in')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 transition"
        >
          <span>Launch Demo Platform</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
