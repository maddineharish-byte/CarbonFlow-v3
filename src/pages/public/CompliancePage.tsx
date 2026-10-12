import React from 'react';
import {
  ShieldCheck,
  Flame,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale
} from 'lucide-react';

interface CompliancePageProps {
  navigate: (path: string) => void;
}

export function CompliancePage({ navigate }: CompliancePageProps) {
  const frameworks = [
    {
      code: 'GHG Protocol',
      title: 'Corporate Accounting & Reporting Standard',
      desc: 'The gold standard for corporate greenhouse gas accounting. CarbonFlow organizes activity emissions into Scope 1 (direct combustion & refrigerants), Scope 2 (purchased electricity using both location-based and market-based methods), and Scope 3 (value chain categories).'
    },
    {
      code: 'ISO 14064-1 & 14064-3',
      title: 'GHG Quantification & Assurance Specifications',
      desc: 'International standards for entity-level greenhouse gas inventory preparation and third-party verification. CarbonFlow supports audit planning, materiality thresholds, and evidence tracing required by ISO-accredited assurance bodies.'
    },
    {
      code: 'CSRD / ESRS E1',
      title: 'EU Corporate Sustainability Reporting Directive',
      desc: 'Mandatory European sustainability reporting requiring gross Scope 1, 2, and 3 disclosures with full digital audit trails. CarbonFlow connects line-item figures directly to supplier invoices and REC certificates.'
    },
    {
      code: 'SEC Climate Disclosure',
      title: 'U.S. Climate-Related Disclosures Rule',
      desc: 'Requires qualitative risk analysis and quantitative Scope 1 and 2 emissions disclosures with attestation reports for large accelerated filers.'
    },
    {
      code: 'California SB 253',
      title: 'Climate Corporate Data Accountability Act',
      desc: 'Requires public and private companies doing business in California with revenue over $1B to disclose verified Scope 1, 2, and 3 emissions annually.'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Regulatory & Voluntary Readiness</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          Carbon & Sustainability Compliance
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Transform complex greenhouse gas accounting frameworks into organized, trackable, and verifiable data pipelines.
        </p>
      </div>

      {/* Legal Disclaimer Box */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-6 text-xs text-amber-950 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
          <Scale className="h-4 w-4" />
          Legal & Regulatory Disclaimer
        </div>
        <p className="mt-2 text-amber-900/90 leading-relaxed">
          CarbonFlow is a specialized software tool designed to assist organizations in gathering, calculating, documenting, and auditing carbon footprint data. CarbonFlow is not a legal authority, official assurance body, or statutory regulator. Each reporting organization remains solely responsible for determining the specific laws, directives, and reporting standards that apply to its jurisdiction and operational boundaries.
        </p>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((f) => (
          <div key={f.code} className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
            <div>
              <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                {f.code}
              </span>
              <h3 className="mt-3 text-base font-bold text-stone-900">{f.title}</h3>
              <p className="mt-2 text-xs text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scope 1, 2, 3 Deep Dive */}
      <div className="rounded-2xl border border-stone-200 bg-white p-8">
        <h2 className="text-2xl font-bold text-stone-900">How CarbonFlow Handles the Three Scopes</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Flame className="h-4 w-4 text-amber-700" />
              Scope 1: Direct Emissions
            </div>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Emissions from sources owned or controlled by the reporting organization (e.g., natural gas commercial boilers, fleet diesel, fugitive refrigerant leaks). Verified against fuel tickets and utility meters.
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
              <CheckCircle2 className="h-4 w-4 text-blue-700" />
              Scope 2: Purchased Electricity
            </div>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Indirect emissions from generation of purchased electricity, heating, cooling, or steam. Supports both location-based eGRID emission factors and market-based Renewable Energy Certificates (RECs).
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-900">
              <ShieldCheck className="h-4 w-4 text-purple-700" />
              Scope 3: Value Chain
            </div>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              All other indirect emissions in upstream and downstream activities (business air travel, road freight haulage, cloud compute data center hosting). Tracked with spend-based or distance-based factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
