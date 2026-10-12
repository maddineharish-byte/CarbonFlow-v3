import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingDown,
  DollarSign,
  Zap,
  ShieldCheck,
  Check,
  Copy,
  ArrowRight,
  Sparkles,
  Building2,
  Truck,
  Factory,
  Laptop,
  Scale,
  Clock,
  HelpCircle
} from 'lucide-react';

interface PresetArchetype {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  baseline: number;
  targetPct: number;
  energySavingPerTon: number;
  carbonPrice: number;
}

const PRESETS: PresetArchetype[] = [
  {
    id: 'tech',
    name: 'Tech & Professional Services',
    icon: Laptop,
    description: 'Data centers, cloud compute, commercial facilities, and business travel.',
    baseline: 2400,
    targetPct: 30,
    energySavingPerTon: 195,
    carbonPrice: 45
  },
  {
    id: 'manufacturing',
    name: 'Industrial & Manufacturing',
    icon: Factory,
    description: 'Boilers, process heating, electricity grids, and raw material throughput.',
    baseline: 14500,
    targetPct: 22,
    energySavingPerTon: 225,
    carbonPrice: 65
  },
  {
    id: 'logistics',
    name: 'Transportation & Logistics',
    icon: Truck,
    description: 'Commercial fleet combustion, cold-chain refrigeration, and freight haulage.',
    baseline: 8200,
    targetPct: 25,
    energySavingPerTon: 240,
    carbonPrice: 50
  },
  {
    id: 'retail',
    name: 'Retail & Commercial Real Estate',
    icon: Building2,
    description: 'Multi-site retail HVAC, lighting, distributed refrigeration, and logistics.',
    baseline: 5600,
    targetPct: 28,
    energySavingPerTon: 180,
    carbonPrice: 40
  }
];

const CARBON_PRICING_BENCHMARKS = [
  { label: 'Voluntary Market', price: 30, desc: 'Average voluntary offset price' },
  { label: 'Corporate Shadow Price', price: 55, desc: 'Internal carbon fee benchmark' },
  { label: 'EU ETS / CBAM', price: 85, desc: 'European compliance carbon allowance' }
];

interface CarbonRoiCalculatorProps {
  onNavigate?: (path: string) => void;
}

export function CarbonRoiCalculator({ onNavigate }: CarbonRoiCalculatorProps) {
  // Calculator inputs state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tech');
  const [baselineEmissions, setBaselineEmissions] = useState<number>(2400);
  const [reductionTargetPct, setReductionTargetPct] = useState<number>(30);
  const [horizonYears, setHorizonYears] = useState<number>(3);
  const [carbonPricePerTon, setCarbonPricePerTon] = useState<number>(45);
  const [energySavingPerTon, setEnergySavingPerTon] = useState<number>(195);
  const [copied, setCopied] = useState<boolean>(false);

  // Apply sector preset
  const handleSelectPreset = (preset: PresetArchetype) => {
    setSelectedPresetId(preset.id);
    setBaselineEmissions(preset.baseline);
    setReductionTargetPct(preset.targetPct);
    setEnergySavingPerTon(preset.energySavingPerTon);
    setCarbonPricePerTon(preset.carbonPrice);
  };

  // Calculations
  const metrics = useMemo(() => {
    // Emissions abated
    const annualEmissionsAbated = Math.round(baselineEmissions * (reductionTargetPct / 100));
    const cumulativeEmissionsAbated = annualEmissionsAbated * horizonYears;

    // Direct OPEX savings from energy/fuel conservation
    const annualEnergySavings = Math.round(annualEmissionsAbated * energySavingPerTon);
    const cumulativeEnergySavings = annualEnergySavings * horizonYears;

    // Carbon liability avoidance (shadow price / carbon tax / ETS compliance fees)
    const annualCarbonTaxAvoidance = Math.round(annualEmissionsAbated * carbonPricePerTon);
    const cumulativeCarbonTaxAvoidance = annualCarbonTaxAvoidance * horizonYears;

    // Automated audit preparation & third-party assurance fee savings
    // Base 120 auditor prep hours saved + scaling with organization emissions size
    const annualAuditAssuranceSavings = Math.round(Math.min(65000, 16500 + baselineEmissions * 0.85));
    const cumulativeAuditAssuranceSavings = annualAuditAssuranceSavings * horizonYears;

    // Totals
    const totalAnnualSavings = annualEnergySavings + annualCarbonTaxAvoidance + annualAuditAssuranceSavings;
    const totalCumulativeSavings = cumulativeEnergySavings + cumulativeCarbonTaxAvoidance + cumulativeAuditAssuranceSavings;

    // Societal Environmental Benefits avoided (EPA Social Cost of Carbon standard $190/tCO2e)
    const annualSocialCostBenefit = Math.round(annualEmissionsAbated * 190);
    const cumulativeSocialCostBenefit = cumulativeEmissionsAbated * 190;

    // Payback period estimation (months) based on typical sustainability initiative implementation costs
    const estimatedImplementationInvestment = Math.round(totalAnnualSavings * 0.35);
    const monthlyRunRateSavings = totalAnnualSavings / 12;
    const paybackMonths = monthlyRunRateSavings > 0 
      ? Math.max(2.1, Math.round((estimatedImplementationInvestment / monthlyRunRateSavings) * 10) / 10)
      : 4.2;

    // Relative percentages for progress distribution
    const totalComponents = annualEnergySavings + annualCarbonTaxAvoidance + annualAuditAssuranceSavings;
    const energyPct = Math.round((annualEnergySavings / totalComponents) * 100);
    const carbonTaxPct = Math.round((annualCarbonTaxAvoidance / totalComponents) * 100);
    const auditPct = 100 - energyPct - carbonTaxPct;

    return {
      annualEmissionsAbated,
      cumulativeEmissionsAbated,
      annualEnergySavings,
      cumulativeEnergySavings,
      annualCarbonTaxAvoidance,
      cumulativeCarbonTaxAvoidance,
      annualAuditAssuranceSavings,
      cumulativeAuditAssuranceSavings,
      totalAnnualSavings,
      totalCumulativeSavings,
      annualSocialCostBenefit,
      cumulativeSocialCostBenefit,
      paybackMonths,
      energyPct,
      carbonTaxPct,
      auditPct
    };
  }, [baselineEmissions, reductionTargetPct, horizonYears, carbonPricePerTon, energySavingPerTon]);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Format number
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  // Copy structured summary
  const handleCopySummary = () => {
    const summaryText = `--- CarbonFlow Enterprise Carbon ROI Summary ---
Baseline Annual Emissions: ${formatNumber(baselineEmissions)} tCO2e
Target Reduction: ${reductionTargetPct}%
Time Horizon: ${horizonYears} Year(s)

Projected Abatement:
- Annual Emissions Avoided: ${formatNumber(metrics.annualEmissionsAbated)} tCO2e/yr
- ${horizonYears}-Year Cumulative Abatement: ${formatNumber(metrics.cumulativeEmissionsAbated)} tCO2e

Financial Impact & Returns:
- Direct Energy & Fuel OPEX Savings: ${formatCurrency(metrics.annualEnergySavings)}/yr (${formatCurrency(metrics.cumulativeEnergySavings)} cumulative)
- Carbon Price / Tax Liability Avoided: ${formatCurrency(metrics.annualCarbonTaxAvoidance)}/yr (${formatCurrency(metrics.cumulativeCarbonTaxAvoidance)} cumulative)
- Audit & Assurance Workflow Savings: ${formatCurrency(metrics.annualAuditAssuranceSavings)}/yr (${formatCurrency(metrics.cumulativeAuditAssuranceSavings)} cumulative)
- Total Annual Value Generated: ${formatCurrency(metrics.totalAnnualSavings)}/yr
- ${horizonYears}-Year Cumulative Net Savings: ${formatCurrency(metrics.totalCumulativeSavings)}
- Estimated Payback Horizon: ${metrics.paybackMonths} months
- Societal Damage Avoidance (EPA SCC $190/t): ${formatCurrency(metrics.cumulativeSocialCostBenefit)}
Generated by CarbonFlow (carbonflow.io)`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header Container */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <Calculator className="h-3.5 w-3.5 text-emerald-600" />
          <span>FINANCIAL VALUE MODELER</span>
        </div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Enterprise Carbon ROI & Cost Savings Calculator
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Decarbonization drives bottom-line profitability. Model your organization's financial return from avoided energy OPEX, mitigated carbon price liabilities, and streamlined audit assurance.
        </p>
      </div>

      {/* Preset Archetype Chips */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Industry Presets:</span>
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Sliders & Configuration (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Input Baseline Parameters</h3>
              <p className="text-xs text-slate-500">Fine-tune the variables for your operating scope.</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-mono font-medium text-slate-600">
              Interactive
            </span>
          </div>

          {/* Slider 1: Baseline Annual Emissions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Baseline Annual Emissions</span>
              </label>
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {formatNumber(baselineEmissions)} <span className="text-xs text-slate-500 font-normal">tCO₂e</span>
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="100"
              value={baselineEmissions}
              onChange={(e) => {
                setBaselineEmissions(Number(e.target.value));
                setSelectedPresetId('custom');
              }}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>500 tCO₂e</span>
              <span>25,000 tCO₂e</span>
              <span>50,000 tCO₂e</span>
            </div>
          </div>

          {/* Slider 2: Target Reduction Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Target Decarbonization Rate</span>
              </label>
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {reductionTargetPct}% <span className="text-xs text-emerald-600 font-normal">Reduction</span>
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={reductionTargetPct}
              onChange={(e) => {
                setReductionTargetPct(Number(e.target.value));
                setSelectedPresetId('custom');
              }}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>5% (Incremental)</span>
              <span>30% (Standard)</span>
              <span>60% (Net-Zero Path)</span>
            </div>
          </div>

          {/* Time Horizon Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Modeling Time Horizon</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((y) => (
                <button
                  key={y}
                  onClick={() => setHorizonYears(y)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition ${
                    horizonYears === y
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {y} {y === 1 ? 'Year' : 'Years'}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 3: Carbon Price / Shadow Benchmark */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-slate-500" />
                <span>Carbon Shadow Price / Regulatory Tax</span>
              </label>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                ${carbonPricePerTon} <span className="text-slate-500 font-normal">/ tCO₂e</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CARBON_PRICING_BENCHMARKS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setCarbonPricePerTon(b.price)}
                  className={`text-[10px] px-2 py-1 rounded border transition ${
                    carbonPricePerTon === b.price
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={b.desc}
                >
                  {b.label} (${b.price})
                </button>
              ))}
            </div>
            <input
              type="range"
              min="15"
              max="150"
              step="5"
              value={carbonPricePerTon}
              onChange={(e) => setCarbonPricePerTon(Number(e.target.value))}
              className="w-full accent-slate-700 cursor-pointer h-1.5 bg-slate-100 rounded-lg mt-2"
            />
          </div>

          {/* Slider 4: Direct Energy & Fuel OPEX Savings Multiplier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Direct Energy Savings Factor</span>
              </label>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                ${energySavingPerTon} <span className="text-slate-500 font-normal">/ tCO₂e abated</span>
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="350"
              step="5"
              value={energySavingPerTon}
              onChange={(e) => setEnergySavingPerTon(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
            <p className="text-[10px] text-slate-400">
              Represents fuel, power, and utility cost avoided per metric ton eliminated.
            </p>
          </div>
        </div>

        {/* Right Column: Real-Time Economic Returns & Value Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Hero Highlight Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Estimated Annual Economic Return
                </span>
                <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {formatCurrency(metrics.totalAnnualSavings)}
                  <span className="text-sm font-normal text-slate-400 ml-2">/ year</span>
                </div>
              </div>

              <div className="sm:text-right bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">
                  {horizonYears}-Year Cumulative Net Savings
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(metrics.totalCumulativeSavings)}
                </div>
              </div>
            </div>

            {/* Quick KPI Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">Annual CO₂e Abated</div>
                <div className="mt-1 text-lg font-bold text-white font-mono">
                  {formatNumber(metrics.annualEmissionsAbated)} <span className="text-xs text-slate-400">tCO₂e</span>
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-400">
                  {formatNumber(metrics.cumulativeEmissionsAbated)} t over {horizonYears}y
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">Estimated Payback</div>
                <div className="mt-1 text-lg font-bold text-emerald-400 font-mono">
                  {metrics.paybackMonths} Months
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  Fast ROI break-even
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-lg bg-slate-900/60 p-3 border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">Societal Damage Avoided</div>
                <div className="mt-1 text-lg font-bold text-cyan-400 font-mono">
                  {formatCurrency(metrics.cumulativeSocialCostBenefit)}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  EPA SCC ($190/t)
                </div>
              </div>
            </div>

            {/* Proportional Value Breakdown Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Value Stream Composition</span>
                <span className="text-emerald-400">{metrics.energyPct}% OPEX / {metrics.carbonTaxPct}% Tax / {metrics.auditPct}% Audit</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${metrics.energyPct}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Direct Energy OPEX: ${metrics.energyPct}%`}
                />
                <div
                  style={{ width: `${metrics.carbonTaxPct}%` }}
                  className="bg-emerald-400 transition-all duration-500"
                  title={`Carbon Tax / Liability: ${metrics.carbonTaxPct}%`}
                />
                <div
                  style={{ width: `${metrics.auditPct}%` }}
                  className="bg-cyan-400 transition-all duration-500"
                  title={`Audit & Assurance Prep: ${metrics.auditPct}%`}
                />
              </div>
            </div>
          </div>

          {/* Granular Savings Stream Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stream 1: Direct Energy OPEX */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Energy & Fuel OPEX</span>
              </div>
              <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(metrics.annualEnergySavings)}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                Direct fuel, grid utility, and thermal efficiency cash savings.
              </p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-mono">
                {horizonYears}y: {formatCurrency(metrics.cumulativeEnergySavings)}
              </div>
            </div>

            {/* Stream 2: Carbon Pricing / ETS Liability */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tax & ETS Avoidance</span>
              </div>
              <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(metrics.annualCarbonTaxAvoidance)}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                Avoided compliance allowances, CBAM tariffs, and shadow taxes.
              </p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-mono">
                {horizonYears}y: {formatCurrency(metrics.cumulativeCarbonTaxAvoidance)}
              </div>
            </div>

            {/* Stream 3: Audit Automation Savings */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700">
                <DollarSign className="h-4 w-4 text-cyan-600 shrink-0" />
                <span>Audit Prep Efficiency</span>
              </div>
              <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(metrics.annualAuditAssuranceSavings)}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                Eliminated manual auditor hours, evidence gathering & reconciliation.
              </p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-mono">
                {horizonYears}y: {formatCurrency(metrics.cumulativeAuditAssuranceSavings)}
              </div>
            </div>
          </div>

          {/* Interactive Action Bar */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 text-center sm:text-left">
              <span className="font-bold text-slate-900">Need a comprehensive board-ready business case?</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Export these parameters or launch the interactive CarbonFlow demo workspace with your organization's data.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onNavigate ? onNavigate('/sign-in') : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition active:scale-95"
              >
                <span>Launch in Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default CarbonRoiCalculator;
