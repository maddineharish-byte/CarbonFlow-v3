import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  FileCheck2,
  ClipboardList,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Calendar,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Sparkles,
  FileText,
  Download,
  BellRing,
  Sliders,
  Zap,
  Radio
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DashboardMetrics,
  OrganizationalThresholds,
  DEFAULT_THRESHOLDS,
  EmissionsThresholdAlert
} from '../../types';
import { MonthlyEmissionsDashboard } from '../../components/dashboard/MonthlyEmissionsDashboard';
import { ExportReportModal } from '../../components/dashboard/ExportReportModal';
import { RealtimeAlertBanner } from '../../components/dashboard/RealtimeAlertBanner';
import { EmissionsNotificationCenter } from '../../components/dashboard/EmissionsNotificationCenter';
import { ThresholdConfigModal } from '../../components/dashboard/ThresholdConfigModal';
import { RealtimeAlertToast } from '../../components/dashboard/RealtimeAlertToast';
import { GlobalFacilitiesMap } from '../../components/dashboard/GlobalFacilitiesMap';

interface DashboardPageProps {
  setTab: (tab: string) => void;
}

export function DashboardPage({ setTab }: DashboardPageProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Real-Time Notification & Threshold States
  const [thresholds, setThresholds] = useState<OrganizationalThresholds>(DEFAULT_THRESHOLDS);
  const [alertsCenterOpen, setAlertsCenterOpen] = useState(false);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isSimulatedSpikeActive, setIsSimulatedSpikeActive] = useState(false);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  const [activeToastAlert, setActiveToastAlert] = useState<EmissionsThresholdAlert | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, thresholdData] = await Promise.all([
        api.getDashboardMetrics(),
        api.getThresholds()
      ]);
      setMetrics(metricsData);
      if (thresholdData) {
        setThresholds(thresholdData);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics or thresholds', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute 12-month data series matching MonthlyEmissionsDashboard
  const historicalMonthlyTotals = useMemo(() => {
    const base = [
      { month: 'Apr 24', monthFull: 'April 2024', period: '2024-Q2', scope1: 72.4, scope2: 138.2, scope3: 54.1, driver: 'Scope 2: Purchased Electricity (52.2%)', cause: 'Spring server load increase and baseline establishment period', rec: 'Enroll in utility renewable tariff and audit HVAC baseline' },
      { month: 'May 24', monthFull: 'May 2024', period: '2024-Q2', scope1: 70.1, scope2: 142.5, scope3: 55.8, driver: 'Scope 2: Purchased Electricity (53.1%)', cause: 'Peak spring server utilization and unoptimized cooling chillers', rec: 'Dispatch CAPA review & negotiate off-peak renewable curtailment' },
      { month: 'Jun 24', monthFull: 'June 2024', period: '2024-Q2', scope1: 65.8, scope2: 135.0, scope3: 52.3, driver: 'Scope 2: Purchased Electricity (53.3%)', cause: 'Cooling demand prior to HVAC efficiency retrofit activation', rec: 'Accelerate solar PPA grid integration' },
      { month: 'Jul 24', monthFull: 'July 2024', period: '2024-Q3', scope1: 63.2, scope2: 132.8, scope3: 50.9, driver: 'Scope 2: Grid Electricity (53.8%)', cause: 'Mid-summer data center cooling load', rec: 'Inspect chiller setpoints' },
      { month: 'Aug 24', monthFull: 'August 2024', period: '2024-Q3', scope1: 61.5, scope2: 129.4, scope3: 49.5, driver: 'Scope 2: Grid Electricity (53.8%)', cause: 'Summer peak facility loads', rec: 'Phase 1 fleet EV transition' },
      { month: 'Sep 24', monthFull: 'September 2024', period: '2024-Q3', scope1: 60.4, scope2: 124.6, scope3: 48.0, driver: 'Scope 2: Purchased Electricity (53.5%)', cause: 'Normal operating load', rec: 'Continue monthly verification' },
      { month: 'Oct 24', monthFull: 'October 2024', period: '2024-Q4', scope1: 59.8, scope2: 121.2, scope3: 47.1, driver: 'Scope 2: Purchased Electricity (53.1%)', cause: 'Efficiency retrofits operational', rec: 'Maintain setpoints' },
      { month: 'Nov 24', monthFull: 'November 2024', period: '2024-Q4', scope1: 58.5, scope2: 120.0, scope3: 46.2, driver: 'Scope 2: Purchased Electricity (53.4%)', cause: 'Controlled supplier travel and cooling', rec: 'Sustain reduction initiatives' },
      { month: 'Dec 24', monthFull: 'December 2024', period: '2024-Q4', scope1: 62.0, scope2: 122.5, scope3: 47.8, driver: 'Scope 2: Purchased Electricity (52.7%)', cause: 'Winter holiday load schedule', rec: 'Monitor heating emissions' },
      { month: 'Jan 25', monthFull: 'January 2025', period: '2025-Q1', scope1: 60.2, scope2: 124.0, scope3: 48.5, driver: 'Scope 2: Grid Electricity (53.3%)', cause: 'Q1 utility meter synchronized', rec: 'Audit supplier freight' },
      { month: 'Feb 25', monthFull: 'February 2025', quarter: '2025-Q1', period: '2025-Q1', scope1: 59.5, scope2: 123.5, scope3: 47.9, driver: 'Scope 2: Grid Electricity (53.5%)', cause: 'Refrigerant maintenance logged', rec: 'Maintain certified contractor log' },
      { month: 'Mar 25', monthFull: 'March 2025', quarter: '2025-Q1', period: '2025-Q1', scope1: 59.6, scope2: 122.5, scope3: 47.9, driver: 'Scope 2: Grid Electricity (53.3%)', cause: 'Latest reconciled reporting period', rec: 'Ready for third-party audit closeout' }
    ];

    if (metrics) {
      const s1 = metrics.scope1Emissions ?? 179.3;
      const s2 = metrics.scope2Emissions ?? 369.99;
      const s3 = metrics.scope3Emissions ?? 144.39;
      if (s1 > 0 || s2 > 0 || s3 > 0) {
        base[9].scope1 = parseFloat((s1 * 0.336).toFixed(1));
        base[9].scope2 = parseFloat((s2 * 0.335).toFixed(1));
        base[9].scope3 = parseFloat((s3 * 0.336).toFixed(1));

        base[10].scope1 = parseFloat((s1 * 0.332).toFixed(1));
        base[10].scope2 = parseFloat((s2 * 0.333).toFixed(1));
        base[10].scope3 = parseFloat((s3 * 0.332).toFixed(1));

        base[11].scope1 = parseFloat((s1 * 0.332).toFixed(1));
        base[11].scope2 = parseFloat(((s2 * 0.332) + (isSimulatedSpikeActive ? 26.5 : 0)).toFixed(1));
        base[11].scope3 = parseFloat((s3 * 0.332).toFixed(1));
      } else if (isSimulatedSpikeActive) {
        base[11].scope2 = parseFloat((base[11].scope2 + 26.5).toFixed(1));
      }
    } else if (isSimulatedSpikeActive) {
      base[11].scope2 = parseFloat((base[11].scope2 + 26.5).toFixed(1));
    }

    return base.map(item => ({
      ...item,
      total: parseFloat((item.scope1 + item.scope2 + item.scope3).toFixed(1))
    }));
  }, [metrics, isSimulatedSpikeActive]);

  // Real-Time Evaluation Engine: Generate alerts whenever monthly emissions exceed defined thresholds
  const alerts: EmissionsThresholdAlert[] = useMemo(() => {
    const ceiling = thresholds.monthlyCeiling;
    const warningLimit = parseFloat(((ceiling * thresholds.warningThresholdPct) / 100).toFixed(1));

    const generated: EmissionsThresholdAlert[] = [];

    historicalMonthlyTotals.forEach(item => {
      const isExceeded = item.total > ceiling;
      const isWarning = item.total > warningLimit && item.total <= ceiling;

      if (isExceeded || isWarning) {
        const excessAmount = isExceeded
          ? parseFloat((item.total - ceiling).toFixed(1))
          : parseFloat((item.total - warningLimit).toFixed(1));
        const excessPercentage = isExceeded
          ? parseFloat((((item.total - ceiling) / ceiling) * 100).toFixed(1))
          : parseFloat((((item.total - warningLimit) / warningLimit) * 100).toFixed(1));

        const alertId = `alert-${item.month.replace(/\s+/g, '-').toLowerCase()}`;
        const isAcked = acknowledgedAlertIds.has(alertId);

        generated.push({
          id: alertId,
          month: item.month,
          monthFull: item.monthFull,
          period: item.period,
          actualEmissions: item.total,
          threshold: ceiling,
          excessAmount,
          excessPercentage,
          severity: isExceeded ? 'CRITICAL' : 'WARNING',
          status: isAcked ? 'ACKNOWLEDGED' : 'ACTIVE',
          scope1: item.scope1,
          scope2: item.scope2,
          scope3: item.scope3,
          primaryScopeDriver: item.driver,
          causeDescription: item.cause,
          recommendedAction: item.rec,
          timestamp: new Date().toISOString()
        });
      }
    });

    return generated;
  }, [historicalMonthlyTotals, thresholds, acknowledgedAlertIds]);

  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'ACTIVE'), [alerts]);
  const activeAlertsCount = activeAlerts.length;

  // Show Toast when a new active breach exists
  const showToastForAlert = (alert: EmissionsThresholdAlert) => {
    setActiveToastAlert(alert);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToastAlert(null);
    }, 7000);
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAcknowledgedAlertIds(prev => new Set([...prev, id]));
  };

  const handleAcknowledgeAll = () => {
    const allIds = new Set(alerts.map(a => a.id));
    setAcknowledgedAlertIds(allIds);
  };

  const handleSaveThresholds = async (updated: OrganizationalThresholds) => {
    try {
      const saved = await api.updateThresholds(updated);
      setThresholds(saved);
      setIsBannerDismissed(false); // Restore banner if threshold change creates new breaches
    } catch (err) {
      console.error('Failed to update thresholds', err);
    }
  };

  const handleToggleSimulatedSpike = () => {
    const nextState = !isSimulatedSpikeActive;
    setIsSimulatedSpikeActive(nextState);
    setIsBannerDismissed(false);

    if (nextState) {
      // Simulate sudden telemetry pulse
      const simulatedSpikeAlert: EmissionsThresholdAlert = {
        id: 'alert-mar-25',
        month: 'Mar 25',
        monthFull: 'March 2025 (Live Telemetry)',
        period: '2025-Q1',
        actualEmissions: 256.5,
        threshold: thresholds.monthlyCeiling,
        excessAmount: parseFloat((256.5 - thresholds.monthlyCeiling).toFixed(1)),
        excessPercentage: parseFloat((((256.5 - thresholds.monthlyCeiling) / thresholds.monthlyCeiling) * 100).toFixed(1)),
        severity: 'CRITICAL',
        status: 'ACTIVE',
        scope1: 59.6,
        scope2: 149.0,
        scope3: 47.9,
        primaryScopeDriver: 'Scope 2: Grid Electricity Surge (58.1%)',
        causeDescription: 'Simulated real-time smart meter influx spike in facilities server cooling',
        recommendedAction: 'Engage automatic peak demand reduction and dispatch emergency energy audit',
        timestamp: new Date().toISOString()
      };
      showToastForAlert(simulatedSpikeAlert);

      // Create notification in persistent store
      api.createNotification({
        title: 'Real-Time Emissions Alert: March 2025',
        message: `Monthly emissions exceeded ${thresholds.monthlyCeiling} tCO2e threshold (recorded 256.5 tCO2e, +21.5 tCO2e surge).`,
        type: 'THRESHOLD_EXCEEDED'
      }).catch(() => {});
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Aggregating authoritative SQL emissions data...</span>
        </div>
      </div>
    );
  }

  const scopeColors: Record<string, string> = {
    'Scope 1 (Direct)': 'bg-amber-500',
    'Scope 2 (Grid Electricity)': 'bg-emerald-600',
    'Scope 3 (Value Chain)': 'bg-teal-600'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Executive Sustainability Cockpit</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Radio className="h-2.5 w-2.5 text-emerald-600 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time carbon inventory, monthly threshold monitoring, and primary evidence audit readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-Time Threshold Alerts Action Button */}
          <button
            onClick={() => setAlertsCenterOpen(true)}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
              activeAlertsCount > 0
                ? 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Open Real-Time Emissions Threshold Alert Center"
          >
            <BellRing className={`h-3.5 w-3.5 ${activeAlertsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
            <span>Alerts</span>
            {activeAlertsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white font-mono">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Threshold Settings Modal Trigger */}
          <button
            onClick={() => setThresholdModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Configure corporate monthly carbon emissions ceiling"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono tabular-nums">Ceiling: {thresholds.monthlyCeiling}t</span>
          </button>

          <button
            onClick={() => setTab('ai-assistant')}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            <span>Gemini Copilot</span>
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Sync SQL</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
            title="Export executive PDF report for current carbon emissions analysis view"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Prominent Real-Time Emissions Threshold Alert Banner */}
      <RealtimeAlertBanner
        alerts={alerts}
        thresholds={thresholds}
        onOpenAlertsCenter={() => setAlertsCenterOpen(true)}
        onOpenThresholdSettings={() => setThresholdModalOpen(true)}
        onSimulateSpike={handleToggleSimulatedSpike}
        isSimulatedSpikeActive={isSimulatedSpikeActive}
        onAcknowledgeAll={handleAcknowledgeAll}
        isDismissed={isBannerDismissed}
        onDismiss={() => setIsBannerDismissed(true)}
        onRestore={() => setIsBannerDismissed(false)}
      />

      {/* Primary KPI Grid (Top MNC Design: Tabular Figures, Unboxed Context) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Emissions */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Gross Emissions</span>
            <Flame className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(metrics.totalEmissions ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">tCO2e</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span className="font-mono tabular-nums">{metrics.totalCarbonRecords ?? 0} activity entries</span>
            <button onClick={() => setTab('carbon-data')} className="text-emerald-700 font-semibold hover:underline">
              Ledger →
            </button>
          </div>
        </div>

        {/* Evidence Verification */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Evidence Verification Rate</span>
            <FileCheck2 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(metrics.totalEvidenceRecords || 0) > 0
              ? Math.round(((metrics.verifiedEvidenceRecords || 0) / metrics.totalEvidenceRecords) * 100)
              : 0}%
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span className="font-mono tabular-nums">{metrics.verifiedEvidenceRecords ?? 0} verified · {metrics.pendingEvidenceRecords ?? 0} pending</span>
            <button onClick={() => setTab('evidence')} className="text-teal-700 font-semibold hover:underline">
              Vault →
            </button>
          </div>
        </div>

        {/* Active Audits & Findings */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Open Audit Findings</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.openFindings ?? 0}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">
              ({metrics.activeAudits ?? 0} active audits)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span className="font-mono tabular-nums">{(metrics.overdueFindings ?? 0) > 0 ? `${metrics.overdueFindings} overdue` : '0 overdue'}</span>
            <button onClick={() => setTab('findings')} className="text-amber-700 font-semibold hover:underline">
              Findings →
            </button>
          </div>
        </div>

        {/* Corrective Actions & Compliance */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Compliance Readiness</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(metrics.totalRequirements || 0) > 0
              ? Math.round(((metrics.compliantRequirements || 0) / metrics.totalRequirements) * 100)
              : 0}%
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span className="font-mono tabular-nums">{metrics.compliantRequirements ?? 0} of {metrics.totalRequirements ?? 0} compliant</span>
            <button onClick={() => setTab('compliance')} className="text-purple-700 font-semibold hover:underline">
              Scorecard →
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Carbon Emissions Trends & Compliance Targets Component */}
      <MonthlyEmissionsDashboard
        metrics={metrics}
        onNavigateToCompliance={() => setTab('compliance')}
        onNavigateToLedger={() => setTab('carbon-data')}
        onExportReport={() => setExportModalOpen(true)}
        thresholds={thresholds}
        activeAlertCount={activeAlertsCount}
        onOpenAlertsCenter={() => setAlertsCenterOpen(true)}
        onOpenThresholdSettings={() => setThresholdModalOpen(true)}
        simulatedExtraEmissions={isSimulatedSpikeActive ? 26.5 : 0}
      />

      {/* Global Facilities & Operational Boundaries Geospatial Map via OpenFreeMap */}
      <GlobalFacilitiesMap
        onNavigateToTravel={() => setTab('travel')}
        onNavigateToLedger={() => setTab('carbon-data')}
      />

      {/* Scope 1, 2, 3 Breakdown Cards */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Emissions Inventory by Protocol Scope</h2>
            <p className="text-xs text-slate-500">GHG Protocol Scope 1 (Direct), Scope 2 (Purchased Electricity), Scope 3 (Value Chain)</p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 font-mono">
            Period: 2025
          </span>
        </div>

        {/* Progress bar visual */}
        <div className="mt-5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {(metrics.emissionsByScope || []).map((item) => (
              <div
                key={item.scope}
                className={`${scopeColors[item.scope] || 'bg-slate-400'} transition-all`}
                style={{ width: `${item.percentage || 0}%` }}
                title={`${item.scope}: ${item.emissionsTotal ?? (item as any).emissions ?? 0} tCO2e (${item.percentage || 0}%)`}
              />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(metrics.emissionsByScope || []).map((item) => (
              <div key={item.scope} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${scopeColors[item.scope] || 'bg-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900">{item.scope}</span>
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {(item.emissionsTotal ?? (item as any).emissions ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">tCO2e</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{item.percentage ?? 0}% share</span>
                  <span>{item.recordCount ?? 0} entries</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Pipeline Sections: Audits, Findings, CAPA */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Open Findings by Severity */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Findings by Severity</h3>
              <p className="text-[11px] text-slate-500">Identified during ongoing auditor validations</p>
            </div>
            <button onClick={() => setTab('findings')} className="text-xs text-emerald-700 font-semibold hover:underline">
              View All ({metrics.openFindings ?? 0}) →
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {(metrics.findingsBySeverity || []).map((item) => {
              const colors: Record<string, string> = {
                CRITICAL: 'bg-rose-50 text-rose-800 border-rose-200',
                HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
                MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
                LOW: 'bg-slate-100 text-slate-800 border-slate-200'
              };
              return (
                <div key={item.severity} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-slate-50/40">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${colors[item.severity] || ''}`}>
                      {item.severity}
                    </span>
                    <span className="text-xs font-medium text-slate-700">Audit Discrepancies</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">{item.count ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corrective Action Status */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Corrective Action Remediation (CAPA)</h3>
              <p className="text-[11px] text-slate-500">Closed-loop task resolution before audit closeout</p>
            </div>
            <button onClick={() => setTab('corrective-actions')} className="text-xs text-emerald-700 font-semibold hover:underline">
              Manage CAPA →
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {(metrics.correctiveActionsByStatus || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-slate-50/40">
                <span className="text-xs font-medium text-slate-700">{item.status}</span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">{item.count ?? 0}</span>
              </div>
            ))}

            {(metrics.overdueCorrectiveActions ?? 0) > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{metrics.overdueCorrectiveActions} corrective action is overdue. Immediate escalation required.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Emissions Alert Center Slide-Over Drawer */}
      <EmissionsNotificationCenter
        isOpen={alertsCenterOpen}
        onClose={() => setAlertsCenterOpen(false)}
        alerts={alerts}
        thresholds={thresholds}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onAcknowledgeAll={handleAcknowledgeAll}
        onOpenThresholdSettings={() => {
          setAlertsCenterOpen(false);
          setThresholdModalOpen(true);
        }}
        onSimulateSpike={handleToggleSimulatedSpike}
        isSimulatedSpikeActive={isSimulatedSpikeActive}
        onNavigateToCorrectiveActions={() => setTab('corrective-actions')}
        onNavigateToLedger={() => setTab('carbon-data')}
        onExportReport={() => setExportModalOpen(true)}
      />

      {/* Organizational Threshold Configuration Modal */}
      <ThresholdConfigModal
        isOpen={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
        historicalMonthTotals={historicalMonthlyTotals.map(m => ({ month: m.month, total: m.total }))}
      />

      {/* Floating Real-Time Alert Toast Notification */}
      <RealtimeAlertToast
        alert={activeToastAlert}
        onDismiss={() => setActiveToastAlert(null)}
        onOpenAlertsCenter={() => {
          setActiveToastAlert(null);
          setAlertsCenterOpen(true);
        }}
      />

      {/* Mock PDF Generation Export Modal */}
      {metrics && (
        <ExportReportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          metrics={metrics}
        />
      )}
    </div>
  );
}
