import React from 'react';
import {
  Building2,
  Flame,
  FileCheck2,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  History,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

interface HowItWorksProps {
  navigate: (path: string) => void;
}

export function HowItWorksPage({ navigate }: HowItWorksProps) {
  const steps = [
    {
      step: 'Step 1',
      title: 'Define Organization & Boundaries',
      icon: Building2,
      desc: 'Set organizational control approach (operational vs. financial), establish reporting period cycles, and define user memberships with appropriate roles.'
    },
    {
      step: 'Step 2',
      title: 'Collect & Calculate Carbon Data',
      icon: Flame,
      desc: 'Log primary activity volumes across Scope 1 (natural gas, fleet fuel), Scope 2 (grid electricity, steam), and Scope 3 (travel, freight, cloud). Transparent calculation: Activity × Factor = Emissions.'
    },
    {
      step: 'Step 3',
      title: 'Attach & Organize Primary Evidence',
      icon: FileCheck2,
      desc: 'Upload corresponding utility invoices, fuel cards, meter statements, and REC attribute certificates directly linked to each activity row.'
    },
    {
      step: 'Step 4',
      title: 'Initiate Structured Carbon Audit',
      icon: ClipboardList,
      desc: 'Schedule an internal or third-party audit engagement. Assign lead auditors, set assurance levels (Limited or Reasonable), and bind target carbon datasets.'
    },
    {
      step: 'Step 5',
      title: 'Validate Records Line-by-Line',
      icon: CheckCircle2,
      desc: 'Auditors inspect activity figures against uploaded documents, logging formal validation sign-offs, reviewer notes, and verification verdicts.'
    },
    {
      step: 'Step 6',
      title: 'Record & Classify Audit Findings',
      icon: AlertTriangle,
      desc: 'When variances, missing evidence, or improper factors are identified, formal findings are opened and assigned a severity level (Low, Medium, High, Critical).'
    },
    {
      step: 'Step 7',
      title: 'Assign Corrective Actions (CAPA)',
      icon: CheckSquare,
      desc: 'Assign specific owners to resolve the root causes of each finding, set hard completion deadlines, and attach resolution documentation for manager sign-off.'
    },
    {
      step: 'Step 8',
      title: 'Track Multi-Framework Compliance',
      icon: ShieldCheck,
      desc: 'Map verified records to specific regulatory and voluntary requirements (GHG Protocol, CSRD ESRS E1, ISO 14064, SEC disclosure rules).'
    },
    {
      step: 'Step 9',
      title: 'Maintain Append-Only Audit Trail',
      icon: History,
      desc: 'Every validation timestamp, document verification, finding edit, and role transition is permanently preserved in an append-only audit trail.'
    },
    {
      step: 'Step 10',
      title: 'Generate Audit-Ready Disclosures & Reports',
      icon: FileSpreadsheet,
      desc: 'Export finalized inventories and evidence trace matrices in clean CSV formats, completely backed by database SQL aggregations.'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Operational Lifecycle</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          How CarbonFlow Works
        </h1>
        <p className="mt-4 text-base text-stone-600">
          A disciplined 10-step journey from raw utility statements to third-party verified, disclosure-ready emissions inventories.
        </p>
      </div>

      <div className="relative border-l-2 border-emerald-200 ml-4 sm:ml-32 space-y-12">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="relative pl-8 sm:pl-12 group">
              {/* Timeline marker */}
              <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-700 bg-white text-emerald-800 shadow-xs">
                <Icon className="h-4 w-4" />
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">{s.step}</span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono text-stone-600">Stage {idx + 1} of 10</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-emerald-950">Test the Complete Workflow Yourself</h3>
        <p className="mt-2 text-xs text-emerald-800">
          The preloaded demo environment contains sample audits, linked evidence, open findings, and corrective actions ready for review.
        </p>
        <button
          onClick={() => navigate('/sign-in')}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 transition"
        >
          <span>Launch Demo Platform</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
