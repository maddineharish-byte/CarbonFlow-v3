import React from 'react';
import { AlertOctagon, BellRing, X, ChevronRight, Zap } from 'lucide-react';
import { EmissionsThresholdAlert } from '../../types';

interface RealtimeAlertToastProps {
  alert: EmissionsThresholdAlert | null;
  onDismiss: () => void;
  onOpenAlertsCenter: () => void;
}

export function RealtimeAlertToast({
  alert,
  onDismiss,
  onOpenAlertsCenter
}: RealtimeAlertToastProps) {
  if (!alert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-red-300 bg-white p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
          <AlertOctagon className="h-5 w-5 animate-pulse" />
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-red-800">
              Live Alert
            </span>
            <span className="text-xs font-bold text-stone-900">{alert.monthFull}</span>
          </div>

          <p className="mt-1 text-xs text-stone-700 leading-snug">
            Emissions exceeded threshold by{' '}
            <strong className="text-red-700 font-mono">+{alert.excessAmount} tCO2e ({alert.excessPercentage}%)</strong>.
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                onDismiss();
                onOpenAlertsCenter();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 hover:underline cursor-pointer"
            >
              <span>Investigate Alert</span>
              <ChevronRight className="h-3 w-3" />
            </button>
            <span className="text-stone-300">•</span>
            <button
              onClick={onDismiss}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
