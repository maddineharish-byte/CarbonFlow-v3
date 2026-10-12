import React from 'react';
import { Leaf, Target, Users, Shield, Award } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Our Mission</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          Integrity in Enterprise Carbon Accounting
        </h1>
        <p className="mt-4 text-base text-stone-600">
          CarbonFlow was created to eliminate the widespread disconnect between corporate sustainability targets and the messy, unverified data behind them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Target className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-stone-900">100% Evidentiary Traceability</h3>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            Every metric ton reported in a disclosure should link to an actual utility statement, fuel invoice, or metered sensor reading. No estimations without documented methodologies.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-stone-900">Deterministic Accounting</h3>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            Emissions calculations must be transparent, verifiable in standard SQL, and mathematically reproducible. We refuse black-box calculation engines.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-stone-900">Audit-Ready by Design</h3>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            By building audit stages, finding severities, and corrective actions directly into the workflow, preparing for third-party limited or reasonable assurance becomes continuous, not a frantic year-end scramble.
          </p>
        </div>
      </div>
    </div>
  );
}
