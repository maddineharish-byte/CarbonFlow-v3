import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area
} from 'recharts';
import {
  TrendingDown,
  Target,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowDownRight,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Download,
  FileText,
  BellRing
} from 'lucide-react';
import { DashboardMetrics, OrganizationalThresholds } from '../../types';

interface MonthlyEmissionsDashboardProps {
  metrics: DashboardMetrics;
  onNavigateToCompliance?: () => void;
  onNavigateToLedger?: () => void;
  onExportReport?: () => void;
  thresholds?: OrganizationalThresholds;
  activeAlertCount?: number;
  onOpenAlertsCenter?: () => void;
  onOpenThresholdSettings?: () => void;
  simulatedExtraEmissions?: number;
}

export interface MonthlyEmissionDataPoint {
  month: string;
  monthFull: string;
  quarter: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  targetCeiling: number; // SBTi / Net-Zero compliance trajectory ceiling
  reductionVsBaseline: number; // Percentage change relative to Apr 2024 baseline (264.7 tCO2e)
  auditValidated: boolean;
  notes?: string;
}

export function MonthlyEmissionsDashboard({
  metrics,
  onNavigateToCompliance,
  onNavigateToLedger,
  onExportReport,
  thresholds,
  activeAlertCount,
  onOpenAlertsCenter,
  onOpenThresholdSettings,
  simulatedExtraEmissions = 0
}: MonthlyEmissionsDashboardProps) {
  // Chart visual display mode: 'stacked' (Scope 1+2+3 stacked bar) vs 'area-trajectory' vs 'total-trend'
  const [chartMode, setChartMode] = useState<'stacked' | 'total' | 'trajectory'>('stacked');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showBaselineLine, setShowBaselineLine] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'12M' | '6M'>('12M');
  const [selectedFramework, setSelectedFramework] = useState<'SBTI' | 'GHG_PROTOCOL' | 'CSRD'>('SBTI');

  // Generate 12-month series harmonized with live metrics
  const fullMonthlyData: MonthlyEmissionDataPoint[] = useMemo(() => {
    const orgCeiling = thresholds?.monthlyCeiling ?? 235.0;

    // Base 12-month trajectory spanning Apr 2024 through Mar 2025
    const baseMonths = [
      { month: 'Apr 24', monthFull: 'April 2024', quarter: '2024-Q2', scope1: 72.4, scope2: 138.2, scope3: 54.1, targetCeiling: 245.0, auditValidated: true, notes: 'Q2 Opening baseline audit closed' },
      { month: 'May 24', monthFull: 'May 2024', quarter: '2024-Q2', scope1: 70.1, scope2: 142.5, scope3: 55.8, targetCeiling: 245.0, auditValidated: true, notes: 'Peak spring server utilization' },
      { month: 'Jun 24', monthFull: 'June 2024', quarter: '2024-Q2', scope1: 65.8, scope2: 135.0, scope3: 52.3, targetCeiling: 242.0, auditValidated: true, notes: 'HVAC efficiency retrofits activated' },
      { month: 'Jul 24', monthFull: 'July 2024', quarter: '2024-Q3', scope1: 63.2, scope2: 132.8, scope3: 50.9, targetCeiling: 242.0, auditValidated: true, notes: 'Solar PPA initial production' },
      { month: 'Aug 24', monthFull: 'August 2024', quarter: '2024-Q3', scope1: 61.5, scope2: 129.4, scope3: 49.5, targetCeiling: 240.0, auditValidated: true, notes: 'Fleet van EV transition Phase 1' },
      { month: 'Sep 24', monthFull: 'September 2024', quarter: '2024-Q3', scope1: 60.4, scope2: 124.6, scope3: 48.0, targetCeiling: 238.0, auditValidated: true, notes: 'Third-party assurance verification' },
      { month: 'Oct 24', monthFull: 'October 2024', quarter: '2024-Q4', scope1: 59.8, scope2: 121.2, scope3: 47.1, targetCeiling: 238.0, auditValidated: true, notes: 'Data center cooling setpoint optimization' },
      { month: 'Nov 24', monthFull: 'November 2024', quarter: '2024-Q4', scope1: 58.5, scope2: 120.0, scope3: 46.2, targetCeiling: 236.0, auditValidated: true, notes: 'Supplier travel reduction program' },
      { month: 'Dec 24', monthFull: 'December 2024', quarter: '2024-Q4', scope1: 62.0, scope2: 122.5, scope3: 47.8, targetCeiling: 236.0, auditValidated: true, notes: 'Winter holiday load schedule' },
      { month: 'Jan 25', monthFull: 'January 2025', quarter: '2025-Q1', scope1: 60.2, scope2: 124.0, scope3: 48.5, targetCeiling: orgCeiling, auditValidated: true, notes: 'Q1 Certified utility meter sync' },
      { month: 'Feb 25', monthFull: 'February 2025', quarter: '2025-Q1', scope1: 59.5, scope2: 123.5, scope3: 47.9, targetCeiling: orgCeiling, auditValidated: true, notes: 'R-410A refrigeration audit logged' },
      { month: 'Mar 25', monthFull: 'March 2025', quarter: '2025-Q1', scope1: 59.6, scope2: 122.5, scope3: 47.9, targetCeiling: orgCeiling, auditValidated: true, notes: 'Latest reconciled period' }
    ];

    // If live metrics provide Scope 1/2/3 breakdown, reconcile 2025-Q1 months (Jan, Feb, Mar 2025)
    const s1 = metrics.scope1Emissions ?? 179.3;
    const s2 = metrics.scope2Emissions ?? 369.99;
    const s3 = metrics.scope3Emissions ?? 144.39;

    if (s1 > 0 || s2 > 0 || s3 > 0) {
      // Jan 2025 (33.6%)
      baseMonths[9].scope1 = parseFloat((s1 * 0.336).toFixed(1));
      baseMonths[9].scope2 = parseFloat((s2 * 0.335).toFixed(1));
      baseMonths[9].scope3 = parseFloat((s3 * 0.336).toFixed(1));
      // Feb 2025 (33.2%)
      baseMonths[10].scope1 = parseFloat((s1 * 0.332).toFixed(1));
      baseMonths[10].scope2 = parseFloat((s2 * 0.333).toFixed(1));
      baseMonths[10].scope3 = parseFloat((s3 * 0.332).toFixed(1));
      // Mar 2025 (33.2%)
      baseMonths[11].scope1 = parseFloat((s1 * 0.332).toFixed(1));
      baseMonths[11].scope2 = parseFloat(((s2 * 0.332) + simulatedExtraEmissions).toFixed(1));
      baseMonths[11].scope3 = parseFloat((s3 * 0.332).toFixed(1));
    } else if (simulatedExtraEmissions > 0) {
      baseMonths[11].scope2 = parseFloat((baseMonths[11].scope2 + simulatedExtraEmissions).toFixed(1));
    }

    const apr24BaselineTotal = 264.7;

    return baseMonths.map(item => {
      const total = parseFloat((item.scope1 + item.scope2 + item.scope3).toFixed(1));
      const reductionVsBaseline = parseFloat((((total - apr24BaselineTotal) / apr24BaselineTotal) * 100).toFixed(1));
      return {
        ...item,
        total,
        reductionVsBaseline
      };
    });
  }, [metrics]);

  // Filtered dataset for selected range (12M vs 6M)
  const displayData = useMemo(() => {
    return timeRange === '6M' ? fullMonthlyData.slice(-6) : fullMonthlyData;
  }, [fullMonthlyData, timeRange]);

  // Summary indicators
  const latestMonth = fullMonthlyData[fullMonthlyData.length - 1];
  const baselineMonth = fullMonthlyData[0];
  const baselineTotal = baselineMonth.total; // 264.7
  const currentTotal = latestMonth.total;
  const trailing12MoTotal = useMemo(() => {
    return parseFloat(fullMonthlyData.reduce((sum, d) => sum + d.total, 0).toFixed(1));
  }, [fullMonthlyData]);

  // Trailing monthly average
  const monthlyAverage = parseFloat((trailing12MoTotal / fullMonthlyData.length).toFixed(1));

  // Target ceiling compliance check
  const latestTarget = latestMonth.targetCeiling; // 235 tCO2e
  const isCompliantWithTarget = currentTotal <= latestTarget;
  const targetBuffer = parseFloat((latestTarget - currentTotal).toFixed(1));
  const targetBufferPct = parseFloat(((targetBuffer / latestTarget) * 100).toFixed(1));

  // Trailing reduction vs baseline
  const overallReductionPct = parseFloat(
    (((currentTotal - baselineTotal) / baselineTotal) * 100).toFixed(1)
  );

  // Framework compliance metrics
  const compliantReqCount = metrics.compliantRequirements ?? 8;
  const totalReqCount = metrics.totalRequirements ?? 10;
  const compliancePct = Math.round((compliantReqCount / (totalReqCount || 1)) * 100);

  // Target trajectory target for 2025 annual ceiling
  const annualTargetCeiling = 2820.0; // 235 tCO2e/month * 12
  const annualPacePct = parseFloat(((trailing12MoTotal / annualTargetCeiling) * 100).toFixed(1));

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
      {/* Component Header with Multi-Option Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Monthly Carbon Emissions Trends & Compliance Targets
            </h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isCompliantWithTarget 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <ShieldCheck className="h-3 w-3" />
              {isCompliantWithTarget ? 'Within Target Envelope' : 'Exceeding Ceiling'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Reconciled 12-month GHG emissions trajectory evaluated against Science-Based Targets (SBTi) and regulatory compliance thresholds.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Framework Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedFramework('SBTI')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                selectedFramework === 'SBTI'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Science-Based Targets 1.5°C Trajectory (235 tCO2e/mo ceiling)"
            >
              SBTi 1.5°C
            </button>
            <button
              type="button"
              onClick={() => setSelectedFramework('GHG_PROTOCOL')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                selectedFramework === 'GHG_PROTOCOL'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="GHG Protocol Scope 1-3 Disaggregation"
            >
              GHG Protocol
            </button>
            <button
              type="button"
              onClick={() => setSelectedFramework('CSRD')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                selectedFramework === 'CSRD'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="CSRD ESRS E1 Climate Transition Standard"
            >
              CSRD ESRS E1
            </button>
          </div>

          {/* Time Horizon Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTimeRange('12M')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                timeRange === '12M'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('6M')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                timeRange === '6M'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Trailing 6M
            </button>
          </div>

          {/* Chart Presentation Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setChartMode('stacked')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                chartMode === 'stacked'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Scope 1, 2, 3 Breakdown"
            >
              By Scope
            </button>
            <button
              type="button"
              onClick={() => setChartMode('total')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                chartMode === 'total'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Gross Monthly Total Bar"
            >
              Total Gross
            </button>
            <button
              type="button"
              onClick={() => setChartMode('trajectory')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                chartMode === 'trajectory'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Trajectory Area Chart"
            >
              Trajectory
            </button>
          </div>

          {/* Target Toggle */}
          <button
            type="button"
            onClick={() => setShowTargetLine(!showTargetLine)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
              showTargetLine
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Target Trajectory Ceiling"
          >
            <Target className="h-3 w-3" />
            <span className="font-mono tabular-nums">Ceiling ({thresholds?.monthlyCeiling ?? 235}t)</span>
          </button>

          {/* Threshold Settings Shortcut */}
          {onOpenThresholdSettings && (
            <button
              type="button"
              onClick={onOpenThresholdSettings}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Configure organizational monthly carbon emissions ceiling"
            >
              <Sliders className="h-3 w-3 text-slate-500" />
              <span>Limits</span>
            </button>
          )}

          {/* Real-Time Alerts Badge in Toolbar */}
          {onOpenAlertsCenter && (
            <button
              type="button"
              onClick={onOpenAlertsCenter}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition shadow-2xs cursor-pointer ${
                (activeAlertCount ?? 0) > 0
                  ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Review real-time emissions threshold alerts"
            >
              <BellRing className={`h-3 w-3 ${(activeAlertCount ?? 0) > 0 ? 'animate-pulse text-rose-600' : 'text-slate-400'}`} />
              <span>
                Alerts {(activeAlertCount ?? 0) > 0 && `(${activeAlertCount})`}
              </span>
            </button>
          )}

          {/* Export Report Action */}
          {onExportReport && (
            <button
              type="button"
              onClick={onExportReport}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
              title="Export executive PDF report for this emissions analysis view"
            >
              <FileText className="h-3 w-3 text-slate-300" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Callout Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Latest Month Emissions */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 transition hover:bg-stone-50">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Latest Month ({latestMonth.month})</span>
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-950">
            {currentTotal} <span className="text-xs font-normal text-stone-500">tCO2e</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>{Math.abs(overallReductionPct)}% vs Apr '24 baseline</span>
          </div>
        </div>

        {/* Progress Toward Target */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 transition hover:bg-stone-50">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Target Compliance Margin</span>
            <Target className="h-3.5 w-3.5 text-emerald-700" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-stone-900">
            {targetBuffer > 0 ? `-${targetBuffer}` : `+${Math.abs(targetBuffer)}`}{' '}
            <span className="text-xs font-normal text-stone-500">tCO2e</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span className="text-emerald-700 font-semibold">
              {targetBufferPct}% under ceiling
            </span>
            <span>Limit: {latestTarget} t</span>
          </div>
        </div>

        {/* 12-Month Trailing Footprint */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 transition hover:bg-stone-50">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>12-Month Cumulative</span>
            <Layers className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-stone-900">
            {trailing12MoTotal.toLocaleString()} <span className="text-xs font-normal text-stone-500">tCO2e</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>Avg {monthlyAverage} t/mo</span>
            <span className="text-stone-700 font-medium">Pace: {annualPacePct}%</span>
          </div>
        </div>

        {/* Regulatory Framework Score */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 transition hover:bg-stone-50">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Compliance Readiness</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-stone-900">
            {compliancePct}%{' '}
            <span className="text-xs font-normal text-stone-500">
              ({compliantReqCount}/{totalReqCount})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span className="text-emerald-700 font-semibold">8 GHG & CSRD Req</span>
            {onNavigateToCompliance && (
              <button
                type="button"
                onClick={onNavigateToCompliance}
                className="text-purple-700 font-semibold hover:underline"
              >
                Scorecard →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="w-full">
        <div className="h-72 sm:h-80 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
            >
              <defs>
                <linearGradient id="colorTrajectory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#b45309" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="colorScope3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
                unit="t"
                domain={[0, 'dataMax + 30']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthlyEmissionDataPoint;
                    const diffFromTarget = parseFloat((data.total - data.targetCeiling).toFixed(1));
                    const isOver = diffFromTarget > 0;

                    return (
                      <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-lg text-xs space-y-2 z-50 min-w-56">
                        <div className="font-bold text-stone-900 border-b border-stone-100 pb-1.5 flex items-center justify-between gap-3">
                          <div>
                            <span className="block text-stone-900">{data.monthFull}</span>
                            <span className="text-[10px] text-stone-400 font-normal">{data.quarter} Reporting Batch</span>
                          </div>
                          <span className="font-mono text-emerald-800 font-extrabold text-sm">
                            {data.total} tCO2e
                          </span>
                        </div>

                        {/* Scope Breakdown */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-stone-600">
                              <span className="h-2 w-2 rounded-full bg-amber-600" />
                              Scope 1 Direct
                            </span>
                            <span className="font-mono font-semibold text-stone-900">{data.scope1} t</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-stone-600">
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                              Scope 2 Purchased Grid
                            </span>
                            <span className="font-mono font-semibold text-stone-900">{data.scope2} t</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-stone-600">
                              <span className="h-2 w-2 rounded-full bg-purple-600" />
                              Scope 3 Value Chain
                            </span>
                            <span className="font-mono font-semibold text-stone-900">{data.scope3} t</span>
                          </div>
                        </div>

                        {/* Compliance Benchmark Comparison */}
                        <div className="border-t border-stone-100 pt-1.5 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">SBTi Target Ceiling:</span>
                            <span className="font-mono font-semibold text-stone-700">{data.targetCeiling} tCO2e</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Compliance Status:</span>
                            <span className={`font-semibold ${!isOver ? 'text-emerald-700' : 'text-red-700'}`}>
                              {!isOver ? `Compliant (${Math.abs(diffFromTarget)}t buffer)` : `Exceeded (+${diffFromTarget}t)`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Vs Baseline (Apr '24):</span>
                            <span className={`font-bold font-mono ${data.reductionVsBaseline <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {data.reductionVsBaseline > 0 ? `+${data.reductionVsBaseline}%` : `${data.reductionVsBaseline}%`}
                            </span>
                          </div>
                        </div>

                        {data.notes && (
                          <div className="rounded bg-stone-50 p-1.5 text-[10px] text-stone-600 border border-stone-100">
                            {data.notes}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
              />

              {/* Target Trajectory Line */}
              {showTargetLine && (
                <ReferenceLine
                  y={235}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'SBTi 1.5°C 2025 Target (235 tCO2e)',
                    fill: '#dc2626',
                    fontSize: 10,
                    position: 'top'
                  }}
                />
              )}

              {/* Apr 2024 Baseline Reference */}
              {showBaselineLine && (
                <ReferenceLine
                  y={264.7}
                  stroke="#78716c"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: 'Baseline Reference (264.7 t)',
                    fill: '#78716c',
                    fontSize: 10,
                    position: 'bottom'
                  }}
                />
              )}

              {/* Chart Mode Renderings */}
              {chartMode === 'stacked' && (
                <>
                  <Bar
                    dataKey="scope1"
                    name="Scope 1 Direct"
                    stackId="a"
                    fill="url(#colorScope1)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="scope2"
                    name="Scope 2 Purchased Grid"
                    stackId="a"
                    fill="url(#colorScope2)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="scope3"
                    name="Scope 3 Value Chain"
                    stackId="a"
                    fill="url(#colorScope3)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="targetCeiling"
                    name="Compliance Target Ceiling"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#dc2626' }}
                    activeDot={{ r: 5 }}
                  />
                </>
              )}

              {chartMode === 'total' && (
                <>
                  <Bar
                    dataKey="total"
                    name="Total Gross Emissions (tCO2e)"
                    fill="#047857"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="targetCeiling"
                    name="Target Ceiling"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#dc2626' }}
                  />
                </>
              )}

              {chartMode === 'trajectory' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Actual Emissions Trajectory"
                    stroke="#047857"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTrajectory)"
                  />
                  <Line
                    type="monotone"
                    dataKey="targetCeiling"
                    name="Compliance Ceiling"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: '#dc2626' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Target Progress & Multi-Framework Compliance Progress Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
        {/* Progress Item 1: SBTi Decarbonization */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              SBTi 1.5°C Paris Trajectory
            </span>
            <span className="font-mono text-emerald-800">
              {Math.abs(overallReductionPct)}% / 25% Goal
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (Math.abs(overallReductionPct) / 25) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-500">
            Tracking 25% reduction by 2030 from 2024 base year. Currently on schedule.
          </p>
        </div>

        {/* Progress Item 2: CSRD ESRS E1 Audit Readiness */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
            <span className="flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-blue-600" />
              CSRD ESRS E1 Climate Evidence
            </span>
            <span className="font-mono text-blue-800">{compliancePct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${compliancePct}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-500">
            {compliantReqCount} of {totalReqCount} disclosure criteria verified with linked evidence items.
          </p>
        </div>

        {/* Progress Item 3: ISO 14064-1 Audit Assurance */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
              ISO 14064-1 Assurance Level
            </span>
            <span className="font-mono text-purple-800">Limited Assurance</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: '85%' }}
            />
          </div>
          <p className="text-[10px] text-stone-500">
            Data accuracy within 5% materiality threshold; primary utility meters verified.
          </p>
        </div>
      </div>
    </div>
  );
}
