import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  BellRing,
  Sliders,
  Zap,
  CheckCircle2,
  X,
  ChevronRight,
  Flame,
  Radio,
  Sparkles
} from 'lucide-react';
import { EmissionsThresholdAlert, OrganizationalThresholds } from '../../types';

interface RealtimeAlertBannerProps {
  alerts: EmissionsThresholdAlert[];
  thresholds: OrganizationalThresholds;
  onOpenAlertsCenter: () => void;
  onOpenThresholdSettings: () => void;
  onSimulateSpike: () => void;
  isSimulatedSpikeActive: boolean;
  onAcknowledgeAll: () => void;
  isDismissed: boolean;
  onDismiss: () => void;
  onRestore: () => void;
}

export function RealtimeAlertBanner({
  alerts,
  thresholds,
  onOpenAlertsCenter,
  onOpenThresholdSettings,
  onSimulateSpike,
  isSimulatedSpikeActive,
  onAcknowledgeAll,
  isDismissed,
  onDismiss,
  onRestore
}: RealtimeAlertBannerProps) {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'WARNING').length;

  // Highest breach month
  const peakAlert = activeAlerts.length > 0
    ? [...activeAlerts].sort((a, b) => b.excessAmount - a.excessAmount)[0]
    : null;

  // If dismissed or no active alerts, show minimal indicator bar
  if (isDismissed || activeAlerts.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-2xs backdrop-blur-xs text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            <span className="font-semibold text-slate-800">Emissions Telemetry Watchdog:</span>
          </div>
          {activeAlerts.length === 0 ? (
            <span className="text-slate-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              All monthly periods within defined corporate ceiling ({thresholds.monthlyCeiling} tCO2e/mo).
            </span>
          ) : (
            <span className="text-slate-600">
              {activeAlerts.length} alert{activeAlerts.length > 1 ? 's' : ''} minimized ({criticalCount} critical).
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && isDismissed && (
            <button
              onClick={onRestore}
              className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
            >
              <span>Show Banner ({activeAlerts.length})</span>
            </button>
          )}

          <button
            onClick={onSimulateSpike}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              isSimulatedSpikeActive
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Simulate sudden smart-meter telemetry influx spike to test real-time alerts"
          >
            <Zap className={`h-3 w-3 ${isSimulatedSpikeActive ? 'text-amber-700' : 'text-slate-500'}`} />
            <span>{isSimulatedSpikeActive ? 'Reset Influx Spike' : 'Simulate Telemetry Spike'}</span>
          </button>

          <button
            onClick={onOpenThresholdSettings}
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <Sliders className="h-3 w-3 text-slate-400" />
            <span className="font-mono tabular-nums">Ceiling: {thresholds.monthlyCeiling}t</span>
          </button>

          <button
            onClick={onOpenAlertsCenter}
            className="flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition shadow-2xs"
          >
            <BellRing className="h-3 w-3" />
            <span>Alerts Center</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Alert Banner
  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-200 bg-linear-to-r from-rose-50/90 via-amber-50/60 to-rose-50/90 p-4 shadow-sm transition-all">
      {/* Decorative pulse line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Alert Badge and Details */}
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
            <AlertOctagon className="h-5 w-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-950 ring-2 ring-white font-mono">
              {activeAlerts.length}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-rose-800">
                <Radio className="h-3 w-3 text-rose-600 animate-pulse" />
                Real-Time Emissions Alert
              </span>
              <span className="text-xs font-semibold text-slate-900 font-mono">
                {criticalCount} Critical Exceedance{criticalCount !== 1 ? 's' : ''}
                {warningCount > 0 && ` · ${warningCount} Warning${warningCount !== 1 ? 's' : ''}`}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
                · Target Ceiling: {thresholds.monthlyCeiling} tCO2e/mo
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-700 leading-relaxed">
              {peakAlert ? (
                <>
                  <strong className="text-rose-950 font-semibold">{peakAlert.monthFull}</strong> recorded{' '}
                  <strong className="font-mono text-rose-900 font-bold">{peakAlert.actualEmissions} tCO2e</strong> (
                  <span className="font-semibold text-rose-700 font-mono">+{peakAlert.excessAmount} tCO2e / {peakAlert.excessPercentage}% above ceiling</span>).{' '}
                  <span className="text-slate-600">Primary driver: {peakAlert.primaryScopeDriver}.</span>
                </>
              ) : (
                'Monthly carbon emissions have surpassed defined organizational compliance thresholds.'
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onSimulateSpike}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              isSimulatedSpikeActive
                ? 'bg-amber-200 text-amber-950 font-semibold hover:bg-amber-300'
                : 'border border-amber-300 bg-amber-100/70 text-amber-900 hover:bg-amber-100'
            }`}
            title="Simulate sudden smart-meter telemetry influx spike"
          >
            <Zap className="h-3.5 w-3.5 text-amber-700" />
            <span>{isSimulatedSpikeActive ? 'Reset Influx' : 'Simulate Spike'}</span>
          </button>

          <button
            onClick={onOpenThresholdSettings}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Adjust organizational monthly emissions ceiling and warning buffer"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Thresholds</span>
          </button>

          <button
            onClick={onOpenAlertsCenter}
            className="flex items-center gap-1.5 rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-800 transition shadow-xs cursor-pointer"
          >
            <BellRing className="h-3.5 w-3.5 animate-pulse" />
            <span>Review Alerts ({activeAlerts.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-slate-700 transition cursor-pointer"
            title="Minimize alert banner"
            aria-label="Minimize alert banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
