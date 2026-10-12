import React, { useState } from 'react';
import {
  Sliders,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ShieldCheck,
  Flame,
  Info,
  Radio,
  Sparkles,
  Zap
} from 'lucide-react';
import { OrganizationalThresholds, DEFAULT_THRESHOLDS } from '../../types';

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: OrganizationalThresholds;
  onSave: (updated: OrganizationalThresholds) => void;
  historicalMonthTotals: Array<{ month: string; total: number }>;
}

export function ThresholdConfigModal({
  isOpen,
  onClose,
  thresholds,
  onSave,
  historicalMonthTotals
}: ThresholdConfigModalProps) {
  const [ceiling, setCeiling] = useState<number>(thresholds.monthlyCeiling);
  const [warningPct, setWarningPct] = useState<number>(thresholds.warningThresholdPct);
  const [scope1, setScope1] = useState<number>(thresholds.scope1Ceiling);
  const [scope2, setScope2] = useState<number>(thresholds.scope2Ceiling);
  const [scope3, setScope3] = useState<number>(thresholds.scope3Ceiling);
  const [autoAlerts, setAutoAlerts] = useState<boolean>(thresholds.autoAlertsEnabled);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(thresholds.soundEnabled);

  if (!isOpen) return null;

  // Real-time impact preview: how many months breach under current candidate ceiling
  const warningCeiling = parseFloat(((ceiling * warningPct) / 100).toFixed(1));
  const candidateBreaches = historicalMonthTotals.filter(m => m.total > ceiling);
  const candidateWarnings = historicalMonthTotals.filter(m => m.total > warningCeiling && m.total <= ceiling);

  const handleResetDefaults = () => {
    setCeiling(DEFAULT_THRESHOLDS.monthlyCeiling);
    setWarningPct(DEFAULT_THRESHOLDS.warningThresholdPct);
    setScope1(DEFAULT_THRESHOLDS.scope1Ceiling);
    setScope2(DEFAULT_THRESHOLDS.scope2Ceiling);
    setScope3(DEFAULT_THRESHOLDS.scope3Ceiling);
    setAutoAlerts(DEFAULT_THRESHOLDS.autoAlertsEnabled);
    setSoundEnabled(DEFAULT_THRESHOLDS.soundEnabled);
  };

  const handleSave = () => {
    const updated: OrganizationalThresholds = {
      ...thresholds,
      monthlyCeiling: ceiling,
      warningThresholdPct: warningPct,
      scope1Ceiling: scope1,
      scope2Ceiling: scope2,
      scope3Ceiling: scope3,
      autoAlertsEnabled: autoAlerts,
      soundEnabled: soundEnabled,
      updatedAt: new Date().toISOString()
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-stone-100 bg-linear-to-r from-stone-50 to-emerald-50/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-2xs">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Define Organizational Emissions Thresholds</h2>
              <p className="text-xs text-stone-500">
                Configure corporate compliance limits that trigger automated real-time alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Live Impact Preview Box */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
                Live Threshold Impact Preview
              </span>
              <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                Ceiling: {ceiling} tCO2e/mo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                <div className="text-[10px] text-stone-500 font-medium">Critical Breaches Triggered</div>
                <div className="mt-0.5 text-lg font-bold font-mono text-red-700">
                  {candidateBreaches.length}{' '}
                  <span className="text-[11px] font-normal text-stone-500">
                    of {historicalMonthTotals.length} months
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                <div className="text-[10px] text-stone-500 font-medium">Warning State (&gt;{warningCeiling}t)</div>
                <div className="mt-0.5 text-lg font-bold font-mono text-amber-700">
                  {candidateWarnings.length}{' '}
                  <span className="text-[11px] font-normal text-stone-500">
                    months approaching
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Monthly Ceiling Slider */}
          <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="monthly-ceiling-range" className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-emerald-800" />
                Corporate Monthly Ceiling Limit
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="monthly-ceiling-input"
                  aria-label="Corporate Monthly Ceiling Limit"
                  type="number"
                  step="1"
                  min="150"
                  max="350"
                  value={ceiling}
                  onChange={e => setCeiling(parseFloat(e.target.value) || 200)}
                  className="w-20 rounded-md border border-stone-300 bg-white px-2 py-1 text-right text-xs font-mono font-bold text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                />
                <span className="text-xs font-medium text-stone-500">tCO2e</span>
              </div>
            </div>

            <input
              id="monthly-ceiling-range"
              aria-label="Corporate Monthly Ceiling Limit Slider"
              type="range"
              min="180"
              max="300"
              step="1"
              value={ceiling}
              onChange={e => setCeiling(parseFloat(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>Strict Net-Zero (180t)</span>
              <span>SBTi 2025 Target (235t)</span>
              <span>Baseline High (300t)</span>
            </div>
          </div>

          {/* Warning Buffer Slider */}
          <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="warning-buffer-range" className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Early Warning Threshold Buffer
              </label>
              <span className="text-xs font-mono font-bold text-amber-800">
                {warningPct}% ({warningCeiling} tCO2e)
              </span>
            </div>

            <input
              id="warning-buffer-range"
              aria-label="Early Warning Threshold Buffer Slider"
              type="range"
              min="80"
              max="98"
              step="1"
              value={warningPct}
              onChange={e => setWarningPct(parseFloat(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[11px] text-stone-500">
              Dispatches amber advisory alerts when monthly emissions reach {warningPct}% of the organizational limit.
            </p>
          </div>

          {/* Scope Sub-Threshold Allocations */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-stone-900">Scope-Specific Sub-Allocations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="scope1-limit-input" className="block text-[11px] font-medium text-stone-600 mb-1">Scope 1 (Direct)</label>
                <div className="flex items-center gap-1">
                  <input
                    id="scope1-limit-input"
                    type="number"
                    value={scope1}
                    onChange={e => setScope1(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-stone-200 px-2 py-1 text-xs font-mono font-bold"
                  />
                  <span className="text-[11px] text-stone-500">t</span>
                </div>
              </div>
              <div>
                <label htmlFor="scope2-limit-input" className="block text-[11px] font-medium text-stone-600 mb-1">Scope 2 (Electricity)</label>
                <div className="flex items-center gap-1">
                  <input
                    id="scope2-limit-input"
                    type="number"
                    value={scope2}
                    onChange={e => setScope2(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-stone-200 px-2 py-1 text-xs font-mono font-bold"
                  />
                  <span className="text-[11px] text-stone-500">t</span>
                </div>
              </div>
              <div>
                <label htmlFor="scope3-limit-input" className="block text-[11px] font-medium text-stone-600 mb-1">Scope 3 (Supply Chain)</label>
                <div className="flex items-center gap-1">
                  <input
                    id="scope3-limit-input"
                    type="number"
                    value={scope3}
                    onChange={e => setScope3(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-stone-200 px-2 py-1 text-xs font-mono font-bold"
                  />
                  <span className="text-[11px] text-stone-500">t</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Behavior Toggles */}
          <div className="space-y-3 rounded-xl border border-stone-200 p-4">
            <h3 className="text-xs font-bold text-stone-900">Automated Alert Delivery Options</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs text-stone-700 cursor-pointer">
                <div>
                  <span className="font-medium">Real-Time In-App Alert Banners &amp; Badges</span>
                  <p className="text-[11px] text-stone-500">Immediately flags breached months across executive dashboards</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoAlerts}
                  onChange={e => setAutoAlerts(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-stone-300 text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-stone-700 cursor-pointer pt-2 border-t border-stone-100">
                <div>
                  <span className="font-medium">Sound Notification on Threshold Breach</span>
                  <p className="text-[11px] text-stone-500">Play subtle audible chime when a new breach event is recorded</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-stone-300 text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 bg-stone-50 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to SBTi Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save &amp; Enforce Thresholds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
