import React, { useState } from 'react';
import {
  BellRing,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  Sliders,
  Zap,
  ArrowRight,
  Flame,
  FileCheck2,
  FileText,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Volume2,
  VolumeX,
  Filter,
  Check
} from 'lucide-react';
import {
  EmissionsThresholdAlert,
  OrganizationalThresholds,
  AlertSeverity
} from '../../types';

interface EmissionsNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: EmissionsThresholdAlert[];
  thresholds: OrganizationalThresholds;
  onAcknowledgeAlert: (id: string) => void;
  onAcknowledgeAll: () => void;
  onOpenThresholdSettings: () => void;
  onSimulateSpike: () => void;
  isSimulatedSpikeActive: boolean;
  onNavigateToCorrectiveActions?: () => void;
  onNavigateToLedger?: () => void;
  onExportReport?: () => void;
}

export function EmissionsNotificationCenter({
  isOpen,
  onClose,
  alerts,
  thresholds,
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onOpenThresholdSettings,
  onSimulateSpike,
  isSimulatedSpikeActive,
  onNavigateToCorrectiveActions,
  onNavigateToLedger,
  onExportReport
}: EmissionsNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL' | 'ACKNOWLEDGED'>('ACTIVE');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  if (!isOpen) return null;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'ACKNOWLEDGED');

  let filteredAlerts = alerts;
  if (activeTab === 'ACTIVE') {
    filteredAlerts = activeAlerts;
  } else if (activeTab === 'ACKNOWLEDGED') {
    filteredAlerts = acknowledgedAlerts;
  }

  if (selectedSeverity !== 'ALL') {
    filteredAlerts = filteredAlerts.filter(a => a.severity === selectedSeverity);
  }

  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'WARNING').length;

  const maxExcess = activeAlerts.reduce((max, a) => Math.max(max, a.excessAmount), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="relative w-full max-w-2xl bg-white min-h-screen shadow-2xl flex flex-col border-l border-stone-200">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <BellRing className="h-4 w-4 animate-pulse" />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                    {activeAlerts.length}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <span>Emissions Alert Center</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                    Real-Time Watchdog
                  </span>
                </h2>
                <p className="text-xs text-stone-500">
                  Continuous monitoring against organizational threshold ({thresholds.monthlyCeiling} tCO2e ceiling)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenThresholdSettings}
                className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
                title="Configure thresholds"
              >
                <Sliders className="h-3.5 w-3.5 text-stone-500" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg border border-red-200 bg-red-50/70 p-2">
              <div className="text-[10px] font-medium text-red-600">Critical Breaches</div>
              <div className="text-base font-extrabold text-red-950 font-mono">{criticalCount}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2">
              <div className="text-[10px] font-medium text-amber-600">Warnings (95%)</div>
              <div className="text-base font-extrabold text-amber-950 font-mono">{warningCount}</div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-2">
              <div className="text-[10px] font-medium text-stone-500">Peak Excess</div>
              <div className="text-base font-extrabold text-stone-900 font-mono">
                {maxExcess > 0 ? `+${maxExcess.toFixed(1)}t` : '0.0t'}
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-2">
              <div className="text-[10px] font-medium text-stone-500">Org Ceiling</div>
              <div className="text-base font-extrabold text-stone-900 font-mono">{thresholds.monthlyCeiling}t</div>
            </div>
          </div>

          {/* Simulation & Real-time Action Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 border border-stone-200/80 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-medium">Live Telemetry Ingestion: Active</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSimulateSpike}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  isSimulatedSpikeActive
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                    : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                }`}
              >
                <Zap className="h-3 w-3" />
                <span>{isSimulatedSpikeActive ? 'Reset Simulated Telemetry' : 'Simulate Telemetry Spike'}</span>
              </button>

              {activeAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={onAcknowledgeAll}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  <span>Acknowledge All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'ACTIVE'
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Active Breaches ({activeAlerts.length})
              </button>
              <button
                onClick={() => setActiveTab('ALL')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'ALL'
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                All Records ({alerts.length})
              </button>
              <button
                onClick={() => setActiveTab('ACKNOWLEDGED')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'ACKNOWLEDGED'
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Acknowledged ({acknowledgedAlerts.length})
              </button>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-700"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="WARNING">Warnings Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">No Alerts In This View</h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm">
                All monthly carbon emissions records are within compliant organizational targets or have been acknowledged.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={onSimulateSpike}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
                >
                  <Zap className="inline h-3.5 w-3.5 mr-1 text-amber-600" />
                  Simulate Telemetry Spike
                </button>
                <button
                  onClick={onOpenThresholdSettings}
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-900 transition"
                >
                  Adjust Thresholds
                </button>
              </div>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isAcknowledged = alert.status === 'ACKNOWLEDGED';
              const progressPct = Math.min(100, Math.round((alert.actualEmissions / (alert.threshold * 1.3)) * 100));
              const thresholdMarkerPct = Math.round((alert.threshold / (alert.threshold * 1.3)) * 100);

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 transition shadow-2xs ${
                    isAcknowledged
                      ? 'border-stone-200 bg-stone-50/70 opacity-75'
                      : isCritical
                      ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200/50'
                      : 'border-amber-300 bg-amber-50/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          isCritical
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isCritical ? (
                          <AlertOctagon className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {alert.severity} THRESHOLD BREACH
                      </span>
                      <span className="text-xs font-bold text-stone-900">{alert.monthFull}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({alert.period})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAcknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded">
                          <Check className="h-3 w-3 text-emerald-600" />
                          Acknowledged
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quantitative Metrics Row */}
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200/60 pb-3">
                    <div>
                      <div className="text-[11px] text-stone-500 font-medium">Recorded Monthly Emissions</div>
                      <div className="text-xl font-bold font-mono text-stone-950">
                        {alert.actualEmissions} <span className="text-xs font-normal text-stone-500">tCO2e</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-stone-500 font-medium">Excess Over Threshold ({alert.threshold}t)</div>
                      <div className="text-sm font-bold font-mono text-red-700">
                        +{alert.excessAmount} tCO2e ({alert.excessPercentage}%)
                      </div>
                    </div>
                  </div>

                  {/* Visual Bar vs Ceiling */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                      <span>Emissions Trajectory</span>
                      <span>Ceiling: {alert.threshold} tCO2e</span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className={`h-full transition-all ${
                          isCritical ? 'bg-red-600' : 'bg-amber-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                      {/* Vertical line indicator for threshold */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-stone-900 z-10"
                        style={{ left: `${thresholdMarkerPct}%` }}
                        title={`Threshold ceiling: ${alert.threshold} tCO2e`}
                      />
                    </div>
                  </div>

                  {/* Scope Breakdown */}
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white/80 border border-stone-200/60 p-2 text-center text-[11px]">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Scope 1 (Direct)</span>
                      <span className="font-mono font-bold text-stone-800">{alert.scope1} t</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Scope 2 (Electricity)</span>
                      <span className="font-mono font-bold text-stone-800">{alert.scope2} t</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Scope 3 (Supply Chain)</span>
                      <span className="font-mono font-bold text-stone-800">{alert.scope3} t</span>
                    </div>
                  </div>

                  {/* Root Cause & Recommendations */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="text-stone-700">
                      <strong className="text-stone-900 font-semibold">Root Cause:</strong> {alert.causeDescription}
                    </div>
                    <div className="text-stone-600">
                      <strong className="text-stone-900 font-semibold">Recommended Remediation:</strong> {alert.recommendedAction}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200/60 pt-3">
                    {onNavigateToCorrectiveActions && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToCorrectiveActions();
                        }}
                        className="flex items-center gap-1 rounded-md bg-purple-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-800 transition cursor-pointer"
                      >
                        <ShieldAlert className="h-3 w-3" />
                        <span>Launch CAPA Remediation</span>
                      </button>
                    )}

                    {onNavigateToLedger && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToLedger();
                        }}
                        className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                      >
                        <Flame className="h-3 w-3 text-emerald-700" />
                        <span>Inspect In Ledger</span>
                      </button>
                    )}

                    {onExportReport && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onExportReport();
                        }}
                        className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                      >
                        <FileText className="h-3 w-3 text-stone-500" />
                        <span>Export Analysis PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-stone-50/80 px-6 py-3 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            <span>Audit-ready ISO 14064-1 & SBTi Compliance Trigger</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-stone-700 hover:text-stone-900 cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
