export interface OrganizationalThresholds {
  monthlyCeiling: number; // e.g., 235.0 tCO2e per month
  warningThresholdPct: number; // e.g., 95% triggers warning
  scope1Ceiling: number; // e.g., 65.0 tCO2e
  scope2Ceiling: number; // e.g., 130.0 tCO2e
  scope3Ceiling: number; // e.g., 52.0 tCO2e
  autoAlertsEnabled: boolean;
  soundEnabled: boolean;
  emailDigestEnabled: boolean;
  updatedAt: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'ELEVATED';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'MUTED' | 'RESOLVED';

export interface EmissionsThresholdAlert {
  id: string;
  month: string; // e.g. 'May 24'
  monthFull: string; // e.g. 'May 2024'
  period: string; // e.g. '2024-Q2'
  actualEmissions: number; // e.g. 268.4
  threshold: number; // e.g. 235.0
  excessAmount: number; // e.g. +33.4
  excessPercentage: number; // e.g. +14.2%
  severity: AlertSeverity;
  status: AlertStatus;
  scope1: number;
  scope2: number;
  scope3: number;
  primaryScopeDriver: string;
  causeDescription: string;
  recommendedAction: string;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export const DEFAULT_THRESHOLDS: OrganizationalThresholds = {
  monthlyCeiling: 235.0,
  warningThresholdPct: 95.0,
  scope1Ceiling: 65.0,
  scope2Ceiling: 130.0,
  scope3Ceiling: 52.0,
  autoAlertsEnabled: true,
  soundEnabled: false,
  emailDigestEnabled: true,
  updatedAt: new Date().toISOString()
};
