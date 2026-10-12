import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  TrendingDown,
  BarChart3,
  Target,
  ArrowDownRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  AlertOctagon,
  SearchCheck,
  Check,
  X,
  ShieldCheck,
  Eye,
  Info,
  HelpCircle,
  Send,
  CheckCheck,
  Layers,
  AlertCircle,
  SlidersHorizontal,
  Activity,
  Zap,
  Globe2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { api } from '../../services/api';
import { CarbonRecord, EmissionFactor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Scope1And2CalculatorModal } from '../../components/carbon/Scope1And2CalculatorModal';
import { EmissionCalculationResult } from '../../utils/emissionsCalculator';

// Outlier Evaluation Engine
export interface OutlierEvaluation {
  isOutlier: boolean;
  score: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  flags: string[];
  primaryReason: string;
  recommendedAction: string;
}

export function evaluateCarbonOutliers(record: CarbonRecord, allRecords: CarbonRecord[]): OutlierEvaluation {
  const flags: string[] = [];
  let score = 0;

  // 1. Extreme Materiality Threshold: Accounts for > 25% or > 95 tCO2e in period
  const periodRecords = allRecords.filter(r => r.reportingPeriod === record.reportingPeriod);
  const periodTotal = periodRecords.reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);
  const shareOfPeriod = periodTotal > 0 ? (record.calculatedEmissions / periodTotal) * 100 : 0;

  if (shareOfPeriod >= 25 || record.calculatedEmissions >= 100) {
    flags.push(`Materiality Anomaly: Generates ${shareOfPeriod.toFixed(1)}% of quarterly inventory (${record.calculatedEmissions.toFixed(1)} tCO2e); requires primary meter statement`);
    score += 40;
  } else if (shareOfPeriod >= 15) {
    flags.push(`Elevated Materiality: High share of quarterly emissions (${shareOfPeriod.toFixed(1)}%)`);
    score += 20;
  }

  // 2. High Global Warming Potential (GWP) Factor
  if (record.emissionFactor >= 1.5 || record.category.toLowerCase().includes('fugitive') || record.activityType.toLowerCase().includes('refrigerant')) {
    flags.push(`High-GWP Factor Anomaly: Factor (${record.emissionFactor}) exceeds standard combustion baseline by >100x; requires certified EPA 608 technician ticket`);
    score += 35;
  }

  // 3. Volumetric Consumption Spike: Extremely high activity amount
  if (record.activityAmount >= 1000000) {
    flags.push(`Volumetric Consumption Spike: Volume (${record.activityAmount.toLocaleString()} ${record.unit}) exceeds bulk batch limit; requires interval meter feed`);
    score += 25;
  }

  // 4. Statistical Category Variance vs peers
  const sameCategory = allRecords.filter(r => r.category === record.category && r.id !== record.id);
  if (sameCategory.length > 0) {
    const avgCategoryEmissions = sameCategory.reduce((sum, r) => sum + r.calculatedEmissions, 0) / sameCategory.length;
    if (avgCategoryEmissions > 0 && record.calculatedEmissions > avgCategoryEmissions * 2.2) {
      const pctOver = Math.round(((record.calculatedEmissions - avgCategoryEmissions) / avgCategoryEmissions) * 100);
      flags.push(`Statistical Category Outlier: +${pctOver}% above peer ${record.category} average`);
      score += 25;
    }
  }

  // 5. Existing audit notes with discrepancies
  const notesLower = (record.notes || '').toLowerCase();
  if (notesLower.includes('variance') || notesLower.includes('missing') || notesLower.includes('discrepancy') || notesLower.includes('license') || notesLower.includes('contractor missing')) {
    flags.push(`Audit Triage Note: Documentation discrepancy noted (${record.notes})`);
    score += 30;
  }

  const isOutlier = score >= 35 || record.status === 'FLAGGED' || flags.length >= 2;
  const severity: 'HIGH' | 'MEDIUM' | 'LOW' = score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
  const primaryReason = flags.length > 0 ? flags[0] : 'Normal parameters';
  const recommendedAction = severity === 'HIGH'
    ? 'Require formal invoice cross-examination and primary meter certification before audit closeout.'
    : 'Verify utility tariff schedule and confirm emission factor vintage matches reporting year.';

  return {
    isOutlier,
    score: Math.min(100, score),
    severity,
    flags,
    primaryReason,
    recommendedAction
  };
}

export function CarbonDataPage() {
  const { role } = useAuth();
  const [records, setRecords] = useState<CarbonRecord[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 12-Month Trends Chart State
  const [chartViewMode, setChartViewMode] = useState<'stacked' | 'grouped' | 'area' | 'total'>('stacked');
  const [showTargetLine, setShowTargetLine] = useState(true);
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);
  const [visibleScopes, setVisibleScopes] = useState({
    scope1: true,
    scope2: true,
    scope3: true
  });

  // Outlier & Suspicious Entries Triage State
  const [showOutliersOnly, setShowOutliersOnly] = useState(false);
  const [selectedOutlierRecord, setSelectedOutlierRecord] = useState<CarbonRecord | null>(null);
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [isOutlierPanelCollapsed, setIsOutlierPanelCollapsed] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isBatchFlagging, setIsBatchFlagging] = useState(false);

  // Scope 1 & 2 Emissions Calculator Modal State
  const [showScopeCalculatorModal, setShowScopeCalculatorModal] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    reportingPeriod: '2025-Q1',
    scope: 'SCOPE_1' as 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3',
    category: 'Stationary Combustion',
    activityType: 'Natural Gas (Commercial Boiler)',
    activityAmount: 1000,
    unit: 'therms',
    emissionFactor: 0.0053,
    source: 'Utility Meter Invoice',
    dataOwner: 'Facilities Team',
    status: 'DRAFT' as 'DRAFT' | 'UNDER_REVIEW' | 'VALIDATED' | 'FLAGGED',
    notes: ''
  });

  const canEdit = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER' || role === 'ANALYST';
  const canDelete = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, factorList] = await Promise.all([
        api.listCarbonRecords({
          period: periodFilter,
          scope: scopeFilter,
          status: statusFilter,
          query: searchQuery
        }),
        api.getEmissionFactors()
      ]);
      setRecords(recRes.items);
      setFactors(factorList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodFilter, scopeFilter, statusFilter, searchQuery]);

  const handleFactorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = factors.find(f => f.id === e.target.value);
    if (selected) {
      setForm(prev => ({
        ...prev,
        scope: selected.scope,
        category: selected.category,
        activityType: selected.activityType,
        unit: selected.unit,
        emissionFactor: selected.factorValue
      }));
    }
  };

  // Trailing 12-Month Carbon Emissions Trends Data
  const monthlyTrendsData = useMemo(() => {
    const baseline = [
      { month: 'Apr 24', monthFull: 'April 2024', scope1: 72.4, scope2: 138.2, scope3: 54.1, target: 245.0 },
      { month: 'May 24', monthFull: 'May 2024', scope1: 70.1, scope2: 142.5, scope3: 55.8, target: 245.0 },
      { month: 'Jun 24', monthFull: 'June 2024', scope1: 65.8, scope2: 135.0, scope3: 52.3, target: 242.0 },
      { month: 'Jul 24', monthFull: 'July 2024', scope1: 63.2, scope2: 132.8, scope3: 50.9, target: 242.0 },
      { month: 'Aug 24', monthFull: 'August 2024', scope1: 61.5, scope2: 129.4, scope3: 49.5, target: 240.0 },
      { month: 'Sep 24', monthFull: 'September 2024', scope1: 60.4, scope2: 124.6, scope3: 48.0, target: 238.0 },
      { month: 'Oct 24', monthFull: 'October 2024', scope1: 59.8, scope2: 121.2, scope3: 47.1, target: 238.0 },
      { month: 'Nov 24', monthFull: 'November 2024', scope1: 58.5, scope2: 120.0, scope3: 46.2, target: 236.0 },
      { month: 'Dec 24', monthFull: 'December 2024', scope1: 62.0, scope2: 122.5, scope3: 47.8, target: 236.0 },
      { month: 'Jan 25', monthFull: 'January 2025', scope1: 60.2, scope2: 124.0, scope3: 48.5, target: 235.0 },
      { month: 'Feb 25', monthFull: 'February 2025', scope1: 59.5, scope2: 123.5, scope3: 47.9, target: 235.0 },
      { month: 'Mar 25', monthFull: 'March 2025', scope1: 59.6, scope2: 122.5, scope3: 47.9, target: 235.0 }
    ];

    // Harmonize with actual carbon records for 2025-Q1
    const q1Records = records.filter(r => r.reportingPeriod === '2025-Q1');
    if (q1Records.length > 0) {
      const s1 = q1Records.filter(r => r.scope === 'SCOPE_1').reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);
      const s2 = q1Records.filter(r => r.scope === 'SCOPE_2').reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);
      const s3 = q1Records.filter(r => r.scope === 'SCOPE_3').reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0);

      // Distribute Q1 emissions realistically across Jan, Feb, Mar 2025
      baseline[9].scope1 = parseFloat((s1 * 0.336).toFixed(1));
      baseline[9].scope2 = parseFloat((s2 * 0.335).toFixed(1));
      baseline[9].scope3 = parseFloat((s3 * 0.336).toFixed(1));

      baseline[10].scope1 = parseFloat((s1 * 0.332).toFixed(1));
      baseline[10].scope2 = parseFloat((s2 * 0.333).toFixed(1));
      baseline[10].scope3 = parseFloat((s3 * 0.332).toFixed(1));

      baseline[11].scope1 = parseFloat((s1 * 0.332).toFixed(1));
      baseline[11].scope2 = parseFloat((s2 * 0.332).toFixed(1));
      baseline[11].scope3 = parseFloat((s3 * 0.332).toFixed(1));
    }

    const baselineTotal = 264.7; // Apr 2024 baseline reference
    return baseline.map(b => {
      const effectiveScope1 = visibleScopes.scope1 ? b.scope1 : 0;
      const effectiveScope2 = visibleScopes.scope2 ? b.scope2 : 0;
      const effectiveScope3 = visibleScopes.scope3 ? b.scope3 : 0;
      const total = parseFloat((effectiveScope1 + effectiveScope2 + effectiveScope3).toFixed(1));
      const rawTotal = parseFloat((b.scope1 + b.scope2 + b.scope3).toFixed(1));
      const reductionVsBaseline = parseFloat((((rawTotal - baselineTotal) / baselineTotal) * 100).toFixed(1));
      return {
        ...b,
        total,
        rawTotal,
        reductionVsBaseline
      };
    });
  }, [records, visibleScopes]);

  // Overall reduction statistics
  const latestMonth = monthlyTrendsData[monthlyTrendsData.length - 1];
  const peakMonth = useMemo(() => {
    return [...monthlyTrendsData].sort((a, b) => b.rawTotal - a.rawTotal)[0];
  }, [monthlyTrendsData]);
  const baselineMonth = monthlyTrendsData[0];
  const totalTrailingEmissions = useMemo(() => {
    return parseFloat(monthlyTrendsData.reduce((sum, m) => sum + m.rawTotal, 0).toFixed(1));
  }, [monthlyTrendsData]);
  const overallReductionPct = useMemo(() => {
    return parseFloat((((latestMonth.rawTotal - baselineMonth.rawTotal) / baselineMonth.rawTotal) * 100).toFixed(1));
  }, [latestMonth, baselineMonth]);

  // Granular Scope Totals for Trailing 12 Months
  const scope1Total = useMemo(() => parseFloat(monthlyTrendsData.reduce((sum, m) => sum + m.scope1, 0).toFixed(1)), [monthlyTrendsData]);
  const scope2Total = useMemo(() => parseFloat(monthlyTrendsData.reduce((sum, m) => sum + m.scope2, 0).toFixed(1)), [monthlyTrendsData]);
  const scope3Total = useMemo(() => parseFloat(monthlyTrendsData.reduce((sum, m) => sum + m.scope3, 0).toFixed(1)), [monthlyTrendsData]);

  const scope1Share = totalTrailingEmissions > 0 ? ((scope1Total / totalTrailingEmissions) * 100).toFixed(1) : '0';
  const scope2Share = totalTrailingEmissions > 0 ? ((scope2Total / totalTrailingEmissions) * 100).toFixed(1) : '0';
  const scope3Share = totalTrailingEmissions > 0 ? ((scope3Total / totalTrailingEmissions) * 100).toFixed(1) : '0';

  const calculatedPreview = parseFloat((form.activityAmount * form.emissionFactor).toFixed(4));

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      reportingPeriod: '2025-Q1',
      scope: 'SCOPE_1',
      category: 'Stationary Combustion',
      activityType: 'Natural Gas (Commercial Boiler)',
      activityAmount: 1000,
      unit: 'therms',
      emissionFactor: 0.0053,
      source: 'Utility Statement',
      dataOwner: 'Facilities Team',
      status: 'DRAFT',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rec: CarbonRecord) => {
    setEditingId(rec.id);
    setForm({
      reportingPeriod: rec.reportingPeriod,
      scope: rec.scope,
      category: rec.category,
      activityType: rec.activityType,
      activityAmount: rec.activityAmount,
      unit: rec.unit,
      emissionFactor: rec.emissionFactor,
      source: rec.source,
      dataOwner: rec.dataOwner,
      status: rec.status,
      notes: rec.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCarbonRecord(editingId, form);
      } else {
        await api.createCarbonRecord(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleApplyScopeCalculation = (result: EmissionCalculationResult) => {
    setEditingId(null);
    setForm({
      reportingPeriod: form.reportingPeriod || '2025-Q1',
      scope: result.scope,
      category: result.category,
      activityType: result.activityType,
      activityAmount: result.activityAmount,
      unit: result.unit,
      emissionFactor: result.effectiveFactor,
      source: result.standardReference,
      dataOwner: form.dataOwner || 'Facilities & Energy Team',
      status: 'VALIDATED',
      notes: `${result.mathAuditTrail} | Methodology: ${result.methodology}`
    });
    setModalOpen(true);
    setActionToast(`Scope ${result.scope === 'SCOPE_1' ? '1' : '2'} emissions calculated: ${result.calculatedEmissionsTco2e} tCO2e (${result.activityType}). Form populated.`);
    setTimeout(() => setActionToast(null), 5000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this carbon record? This will be recorded in the audit trail.')) return;
    try {
      await api.deleteCarbonRecord(id);
      loadData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const exportCsv = () => {
    const headers = 'ID,Period,Scope,Category,Activity Type,Amount,Unit,Factor,Calculated Emissions (tCO2e),Source,Owner,Status\n';
    const rows = records.map(r => 
      `"${r.id}","${r.reportingPeriod}","${r.scope}","${r.category}","${r.activityType}",${r.activityAmount},"${r.unit}",${r.emissionFactor},${r.calculatedEmissions},"${r.source}","${r.dataOwner}","${r.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Outlier Evaluation Map & Aggregated Metrics
  const outlierMap = useMemo(() => {
    const map = new Map<string, OutlierEvaluation>();
    records.forEach(r => {
      map.set(r.id, evaluateCarbonOutliers(r, records));
    });
    return map;
  }, [records]);

  const detectedOutliers = useMemo(() => {
    return records.filter(r => {
      const ev = outlierMap.get(r.id);
      return ev?.isOutlier || r.status === 'FLAGGED';
    });
  }, [records, outlierMap]);

  const highSeverityCount = useMemo(() => {
    return detectedOutliers.filter(r => outlierMap.get(r.id)?.severity === 'HIGH').length;
  }, [detectedOutliers, outlierMap]);

  const totalOutlierEmissions = useMemo(() => {
    return parseFloat(detectedOutliers.reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0).toFixed(2));
  }, [detectedOutliers]);

  const totalLedgerEmissions = useMemo(() => {
    return parseFloat(records.reduce((sum, r) => sum + (r.calculatedEmissions || 0), 0).toFixed(2));
  }, [records]);

  const outlierEmissionsPct = useMemo(() => {
    if (totalLedgerEmissions <= 0) return 0;
    return parseFloat(((totalOutlierEmissions / totalLedgerEmissions) * 100).toFixed(1));
  }, [totalOutlierEmissions, totalLedgerEmissions]);

  const validatedCount = useMemo(() => records.filter(r => r.status === 'VALIDATED').length, [records]);
  const underReviewCount = useMemo(() => records.filter(r => r.status === 'UNDER_REVIEW').length, [records]);
  const flaggedCount = useMemo(() => records.filter(r => r.status === 'FLAGGED').length, [records]);

  const displayedRecords = useMemo(() => {
    if (showOutliersOnly) {
      return records.filter(r => outlierMap.get(r.id)?.isOutlier || r.status === 'FLAGGED');
    }
    return records;
  }, [records, showOutliersOnly, outlierMap]);

  // Quick Status Updater for Audit Team
  const handleUpdateRecordStatus = async (
    recordId: string, 
    newStatus: 'VALIDATED' | 'UNDER_REVIEW' | 'FLAGGED' | 'DRAFT', 
    auditNoteAddon?: string
  ) => {
    try {
      const target = records.find(r => r.id === recordId);
      if (!target) return;
      
      let updatedNotes = target.notes || '';
      if (auditNoteAddon) {
        updatedNotes = updatedNotes ? `${updatedNotes} | ${auditNoteAddon}` : auditNoteAddon;
      }
      
      await api.updateCarbonRecord(recordId, {
        status: newStatus,
        notes: updatedNotes
      });
      
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: newStatus, notes: updatedNotes } : r));
      
      const label = newStatus === 'FLAGGED' 
        ? 'FLAGGED for audit review' 
        : newStatus === 'UNDER_REVIEW' 
        ? 'moved to UNDER REVIEW' 
        : newStatus === 'VALIDATED' 
        ? 'marked as VALIDATED' 
        : 'set to DRAFT';
      
      setActionToast(`Record ${target.id} (${target.activityType}) successfully ${label}.`);
      setTimeout(() => setActionToast(null), 4000);
      
      if (selectedOutlierRecord?.id === recordId) {
        setSelectedOutlierRecord(prev => prev ? { ...prev, status: newStatus, notes: updatedNotes } : null);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Network error'}`);
    }
  };

  // Batch Flag All Outliers for Audit Team
  const handleBatchFlagAllOutliers = async () => {
    const unflaggedOutliers = detectedOutliers.filter(r => r.status !== 'FLAGGED');
    if (unflaggedOutliers.length === 0) {
      setActionToast('All detected outlier entries are already flagged for audit review.');
      setTimeout(() => setActionToast(null), 3000);
      return;
    }
    
    setIsBatchFlagging(true);
    try {
      for (const rec of unflaggedOutliers) {
        const evalInfo = outlierMap.get(rec.id);
        const flagReason = evalInfo?.primaryReason || 'Statistical anomaly detected by triage engine';
        const updatedNote = rec.notes 
          ? `${rec.notes} [Auto-Flagged: ${flagReason}]` 
          : `[Auto-Flagged: ${flagReason}]`;
        
        await api.updateCarbonRecord(rec.id, {
          status: 'FLAGGED',
          notes: updatedNote
        });
      }
      
      await loadData();
      setActionToast(`Successfully auto-flagged ${unflaggedOutliers.length} suspicious entries in the audit ledger.`);
      setTimeout(() => setActionToast(null), 4000);
    } catch (err: any) {
      alert(`Batch flag failed: ${err.message || 'Error updating records'}`);
    } finally {
      setIsBatchFlagging(false);
    }
  };

  const statusBadges: Record<string, string> = {
    VALIDATED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200/80',
    FLAGGED: 'bg-red-50 text-red-700 border-red-200/80',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const scopeBadges: Record<string, string> = {
    SCOPE_1: 'bg-amber-50 text-amber-800 border-amber-200',
    SCOPE_2: 'bg-blue-50 text-blue-800 border-blue-200',
    SCOPE_3: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Carbon Accounting Ledger</h1>
            <span className="rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              ISO 14064-1 & GHG Protocol
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Authoritative organizational greenhouse gas inventory with deterministic calculations: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">Activity Amount × Emission Factor = Emissions (tCO2e)</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowScopeCalculatorModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
            title="Calculate Scope 1 and Scope 2 emissions based on fuel consumption or energy usage metrics"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-700" />
            <span>Scope 1 & 2 Calculator</span>
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Log Carbon Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* 12-Month Monthly Carbon Emissions Trends & Reduction Progress Chart */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0 border border-emerald-100">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Monthly Carbon Emissions Trends & Scopes Decomposition
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 font-mono">
                  <TrendingDown className="h-3 w-3" />
                  {overallReductionPct <= 0 ? `${Math.abs(overallReductionPct)}% Decarbonization` : `+${overallReductionPct}%`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Trailing 12-month gross GHG emissions trajectory across Scope 1 (Direct), Scope 2 (Electricity), and Scope 3 (Value Chain).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setChartViewMode('stacked')}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  chartViewMode === 'stacked'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Stacked Scopes per month"
              >
                Stacked
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('grouped')}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  chartViewMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grouped comparative bars side-by-side"
              >
                Grouped
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('area')}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  chartViewMode === 'area'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Smooth trajectory area chart"
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('total')}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  chartViewMode === 'total'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Total Gross Emissions"
              >
                Total Gross
              </button>
            </div>

            {/* Scope Toggle Filters */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={() => setVisibleScopes(prev => ({ ...prev, scope1: !prev.scope1 }))}
                className={`rounded-md border px-2 py-1 text-[10px] font-bold transition flex items-center gap-1 ${
                  visibleScopes.scope1
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-400 line-through'
                }`}
                title="Toggle Scope 1 Direct Emissions"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Scope 1
              </button>
              <button
                type="button"
                onClick={() => setVisibleScopes(prev => ({ ...prev, scope2: !prev.scope2 }))}
                className={`rounded-md border px-2 py-1 text-[10px] font-bold transition flex items-center gap-1 ${
                  visibleScopes.scope2
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-400 line-through'
                }`}
                title="Toggle Scope 2 Purchased Electricity"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Scope 2
              </button>
              <button
                type="button"
                onClick={() => setVisibleScopes(prev => ({ ...prev, scope3: !prev.scope3 }))}
                className={`rounded-md border px-2 py-1 text-[10px] font-bold transition flex items-center gap-1 ${
                  visibleScopes.scope3
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 bg-white text-slate-400 line-through'
                }`}
                title="Toggle Scope 3 Value Chain"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Scope 3
              </button>
            </div>

            {/* Target Line Toggle */}
            <button
              type="button"
              onClick={() => setShowTargetLine(!showTargetLine)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                showTargetLine
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
              title="Toggle Science-Based Target Ceiling (235 tCO2e)"
            >
              <Target className="h-3 w-3" />
              <span>Target Ceiling</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsChartCollapsed(!isChartCollapsed)}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
              title={isChartCollapsed ? 'Expand Chart' : 'Collapse Chart'}
            >
              {isChartCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {!isChartCollapsed && (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] text-slate-500 font-medium">Latest Month (Mar '25)</span>
                <div className="mt-1 text-lg font-bold font-mono text-emerald-900 tabular-nums">
                  {latestMonth.total} <span className="text-xs font-normal text-slate-500">tCO2e</span>
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 font-mono">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>{Math.abs(latestMonth.reductionVsBaseline)}% below baseline</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] text-slate-500 font-medium">Scope 1 (Direct)</span>
                <div className="mt-1 text-lg font-bold font-mono text-amber-900 tabular-nums">
                  {scope1Total.toLocaleString()} <span className="text-xs font-normal text-slate-500">t</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500 font-mono">
                  {scope1Share}% of 12-month total
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] text-slate-500 font-medium">Scope 2 (Electricity)</span>
                <div className="mt-1 text-lg font-bold font-mono text-blue-900 tabular-nums">
                  {scope2Total.toLocaleString()} <span className="text-xs font-normal text-slate-500">t</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500 font-mono">
                  {scope2Share}% of 12-month total
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] text-slate-500 font-medium">Scope 3 (Value Chain)</span>
                <div className="mt-1 text-lg font-bold font-mono text-indigo-900 tabular-nums">
                  {scope3Total.toLocaleString()} <span className="text-xs font-normal text-slate-500">t</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500 font-mono">
                  {scope3Share}% of 12-month total
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-500 font-medium">Net-Zero Trajectory</span>
                <div className="mt-1 text-lg font-bold font-mono text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>On Track</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500 font-mono">
                  &lt;235 tCO2e SBTi ceiling
                </div>
              </div>
            </div>

            {/* Recharts Data Visualization Component */}
            <div className="h-72 sm:h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'area' ? (
                  <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scope1Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="scope2Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="scope3Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      unit="t"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1.5 z-50 min-w-[210px]">
                              <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
                                <span>{data.monthFull}</span>
                                <span className="font-mono text-emerald-800 font-extrabold tabular-nums">{data.rawTotal} tCO2e</span>
                              </div>
                              <div className="space-y-1 pt-0.5 text-[11px]">
                                {visibleScopes.scope1 && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                                      Scope 1 Direct
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                      {data.scope1} t ({((data.scope1 / data.rawTotal) * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                )}
                                {visibleScopes.scope2 && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                                      Scope 2 Electricity
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                      {data.scope2} t ({((data.scope2 / data.rawTotal) * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                )}
                                {visibleScopes.scope3 && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                      Scope 3 Value Chain
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                      {data.scope3} t ({((data.scope3 / data.rawTotal) * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                )}
                                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">Vs Apr '24 Baseline:</span>
                                  <span className={`font-bold font-mono ${data.reductionVsBaseline <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {data.reductionVsBaseline > 0 ? `+${data.reductionVsBaseline}%` : `${data.reductionVsBaseline}%`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    {showTargetLine && (
                      <ReferenceLine
                        y={235}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: '2025 SBTi Target (235 tCO2e)',
                          fill: '#dc2626',
                          fontSize: 10,
                          position: 'top'
                        }}
                      />
                    )}
                    {visibleScopes.scope1 && (
                      <Area
                        type="monotone"
                        dataKey="scope1"
                        name="Scope 1 Direct"
                        stroke="#d97706"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#scope1Grad)"
                      />
                    )}
                    {visibleScopes.scope2 && (
                      <Area
                        type="monotone"
                        dataKey="scope2"
                        name="Scope 2 Electricity"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#scope2Grad)"
                      />
                    )}
                    {visibleScopes.scope3 && (
                      <Area
                        type="monotone"
                        dataKey="scope3"
                        name="Scope 3 Value Chain"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#scope3Grad)"
                      />
                    )}
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      unit="t"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1.5 z-50 min-w-[210px]">
                              <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
                                <span>{data.monthFull}</span>
                                <span className="font-mono text-emerald-800 font-extrabold tabular-nums">{data.rawTotal} tCO2e</span>
                              </div>
                              <div className="space-y-1 pt-0.5 text-[11px]">
                                {visibleScopes.scope1 && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                                      Scope 1 Direct
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                      {data.scope1} t ({((data.scope1 / data.rawTotal) * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                )}
                                {visibleScopes.scope2 && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                                      Scope 2 Electricity
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                      {data.scope2} t ({((data.scope2 / data.rawTotal) * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                )}
                                {visibleScopes.scope3 && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                      Scope 3 Value Chain
                                    </span>
                                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                      {data.scope3} t ({((data.scope3 / data.rawTotal) * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                )}
                                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">Vs Apr '24 Baseline:</span>
                                  <span className={`font-bold font-mono ${data.reductionVsBaseline <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {data.reductionVsBaseline > 0 ? `+${data.reductionVsBaseline}%` : `${data.reductionVsBaseline}%`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                    />
                    {showTargetLine && (
                      <ReferenceLine
                        y={235}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: '2025 SBTi Target (235 tCO2e)',
                          fill: '#dc2626',
                          fontSize: 10,
                          position: 'top'
                        }}
                      />
                    )}

                    {chartViewMode === 'stacked' ? (
                      <>
                        {visibleScopes.scope1 && (
                          <Bar
                            dataKey="scope1"
                            name="Scope 1 Direct"
                            stackId="a"
                            fill="#d97706"
                            radius={[0, 0, 0, 0]}
                          />
                        )}
                        {visibleScopes.scope2 && (
                          <Bar
                            dataKey="scope2"
                            name="Scope 2 Electricity"
                            stackId="a"
                            fill="#2563eb"
                            radius={[0, 0, 0, 0]}
                          />
                        )}
                        {visibleScopes.scope3 && (
                          <Bar
                            dataKey="scope3"
                            name="Scope 3 Value Chain"
                            stackId="a"
                            fill="#6366f1"
                            radius={[3, 3, 0, 0]}
                          />
                        )}
                      </>
                    ) : chartViewMode === 'grouped' ? (
                      <>
                        {visibleScopes.scope1 && (
                          <Bar
                            dataKey="scope1"
                            name="Scope 1 Direct"
                            fill="#d97706"
                            radius={[3, 3, 0, 0]}
                          />
                        )}
                        {visibleScopes.scope2 && (
                          <Bar
                            dataKey="scope2"
                            name="Scope 2 Electricity"
                            fill="#2563eb"
                            radius={[3, 3, 0, 0]}
                          />
                        )}
                        {visibleScopes.scope3 && (
                          <Bar
                            dataKey="scope3"
                            name="Scope 3 Value Chain"
                            fill="#6366f1"
                            radius={[3, 3, 0, 0]}
                          />
                        )}
                      </>
                    ) : (
                      <Bar
                        dataKey="total"
                        name="Total Gross Emissions"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                      >
                        {monthlyTrendsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === monthlyTrendsData.length - 1
                                ? '#047857'
                                : entry.total >= 240
                                ? '#b45309'
                                : '#10b981'
                            }
                          />
                        ))}
                      </Bar>
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Action Toast Feedback Banner */}
      {actionToast && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionToast}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Automated Audit Triage: Suspicious & Outlier Activity Entries Panel */}
      <div className="rounded-xl border border-amber-200 bg-linear-to-b from-amber-50/50 via-white to-white p-5 shadow-2xs space-y-4">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-200/60 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-900 shrink-0 border border-amber-200">
              <ShieldAlert className="h-5 w-5 text-amber-700" />
              {detectedOutliers.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Automated Audit Triage: Suspicious & Outlier Activity Entries
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  detectedOutliers.length > 0 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  <AlertTriangle className="h-3 w-3" />
                  {detectedOutliers.length} Entries Auto-Flagged
                </span>
                {highSeverityCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-900">
                    {highSeverityCount} High Severity
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Algorithmic anomaly screening evaluating materiality thresholds (&gt;25% quarterly emissions), high-GWP multipliers, volumetric spikes, and peer variance per ISO 14064-3 limited assurance rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowOutliersOnly(!showOutliersOnly)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                showOutliersOnly
                  ? 'border-amber-400 bg-amber-200/80 text-amber-950 shadow-2xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-amber-800" />
              <span>{showOutliersOnly ? 'Showing Outliers Only' : 'Filter Suspicious Entries'}</span>
            </button>

            {canEdit && (
              <button
                type="button"
                disabled={isBatchFlagging || detectedOutliers.every(r => r.status === 'FLAGGED')}
                onClick={handleBatchFlagAllOutliers}
                className="flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                title="Automatically update all detected outliers to FLAGGED in the audit ledger"
              >
                {isBatchFlagging ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Batch Flag All for Audit Review</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowProtocolModal(true)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1"
              title="View ISO 14064-3 anomaly detection rules and heuristics"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>Protocol Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOutlierPanelCollapsed(!isOutlierPanelCollapsed)}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50 transition"
              title={isOutlierPanelCollapsed ? 'Expand Outlier Panel' : 'Collapse Outlier Panel'}
            >
              {isOutlierPanelCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {!isOutlierPanelCollapsed && (
          <div className="space-y-3.5">
            {/* Quick Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                <span className="text-[11px] text-slate-500 font-medium">Suspicious Entries</span>
                <div className="mt-0.5 text-base font-bold font-mono text-amber-950 tabular-nums">
                  {detectedOutliers.length} <span className="text-xs font-normal text-slate-500">of {records.length} records</span>
                </div>
                <div className="text-[10px] text-amber-800 font-medium">
                  {highSeverityCount} require primary evidence
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                <span className="text-[11px] text-slate-500 font-medium">Outlier Materiality Total</span>
                <div className="mt-0.5 text-base font-bold font-mono text-slate-900 tabular-nums">
                  {totalOutlierEmissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO2e</span>
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  {outlierEmissionsPct}% of reporting inventory
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                <span className="text-[11px] text-slate-500 font-medium">Ledger Audit Status</span>
                <div className="mt-0.5 text-base font-bold font-mono text-slate-900 tabular-nums">
                  {flaggedCount} <span className="text-xs font-normal text-slate-500">Flagged in Ledger</span>
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  {underReviewCount} under reviewer verification
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                <span className="text-[11px] text-slate-500 font-medium">Assurance Risk Triage</span>
                <div className="mt-0.5 text-base font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-700" />
                  <span>{detectedOutliers.length > 0 ? 'Triage Required' : 'Low Risk'}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  ISO 14064-3 screening active
                </div>
              </div>
            </div>

            {/* Outliers Cards List */}
            {detectedOutliers.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 text-center text-xs text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold">No suspicious or outlier emissions detected in this dataset.</span>
                <p className="text-slate-500 mt-0.5">All activity entries fall within standard statistical variance and materiality limits.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {detectedOutliers.map(rec => {
                  const evalInfo = outlierMap.get(rec.id) || evaluateCarbonOutliers(rec, records);
                  const isAlreadyFlagged = rec.status === 'FLAGGED';

                  return (
                    <div
                      key={`outlier-${rec.id}`}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-amber-300 transition space-y-2.5"
                    >
                      {/* Outlier Card Top */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${scopeBadges[rec.scope] || ''}`}>
                              {rec.scope.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                              {rec.activityType}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">({rec.id})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rec.category} • <span className="font-mono">{rec.reportingPeriod}</span>
                          </div>
                        </div>

                        {/* Severity & Score Badge */}
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            evalInfo.severity === 'HIGH'
                              ? 'bg-red-50 text-red-900 border-red-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            <AlertTriangle className="h-3 w-3" />
                            {evalInfo.severity} Risk ({evalInfo.score}/100)
                          </span>
                          <div className="mt-1 font-mono text-xs font-extrabold text-slate-900 tabular-nums">
                            {rec.calculatedEmissions.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">tCO2e</span>
                          </div>
                        </div>
                      </div>

                      {/* Anomaly Score Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Anomaly Confidence Score</span>
                          <span className="font-mono font-semibold">{evalInfo.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              evalInfo.severity === 'HIGH' ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${evalInfo.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Detected Anomaly Flags */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Detected Anomaly Flags:</span>
                        <div className="flex flex-col gap-1">
                          {evalInfo.flags.map((flag, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 bg-slate-50 rounded-md p-1.5 border border-slate-100">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Audit Procedure */}
                      <div className="rounded-lg bg-amber-50/70 p-2 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-1.5">
                        <Info className="h-3.5 w-3.5 text-amber-800 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Recommended Action: </span>
                          <span>{evalInfo.recommendedAction}</span>
                        </div>
                      </div>

                      {/* Card Audit Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">Status:</span>
                          <span className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${statusBadges[rec.status] || ''}`}>
                            {rec.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canEdit && !isAlreadyFlagged && (
                            <button
                              type="button"
                              onClick={() => handleUpdateRecordStatus(rec.id, 'FLAGGED', 'Manually confirmed outlier during triage')}
                              className="rounded-md bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 transition shadow-2xs"
                              title="Flag this record in the audit ledger for the assurance team"
                            >
                              Flag for Audit
                            </button>
                          )}

                          {canEdit && rec.status !== 'UNDER_REVIEW' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateRecordStatus(rec.id, 'UNDER_REVIEW', 'Sent for documentation review')}
                              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Under Review
                            </button>
                          )}

                          {canEdit && rec.status !== 'VALIDATED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateRecordStatus(rec.id, 'VALIDATED', 'Cleared by auditor override')}
                              className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                              title="Override anomaly and mark as validated"
                            >
                              Validate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedOutlierRecord(rec)}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                            title="Open detailed audit anomaly inspection"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Filter Chips & Search Bar */}
      <div className="space-y-2">
        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => { setShowOutliersOnly(false); setStatusFilter('ALL'); }}
            className={`rounded-lg px-3 py-1 font-semibold transition border ${
              !showOutliersOnly && statusFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Activity Records ({records.length})
          </button>

          <button
            type="button"
            onClick={() => { setShowOutliersOnly(!showOutliersOnly); }}
            className={`rounded-lg px-3 py-1 font-semibold transition border flex items-center gap-1.5 ${
              showOutliersOnly
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Suspicious & Outliers ({detectedOutliers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowOutliersOnly(false); setStatusFilter('VALIDATED'); }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition border ${
              !showOutliersOnly && statusFilter === 'VALIDATED'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Validated ({validatedCount})
          </button>

          <button
            type="button"
            onClick={() => { setShowOutliersOnly(false); setStatusFilter('UNDER_REVIEW'); }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition border ${
              !showOutliersOnly && statusFilter === 'UNDER_REVIEW'
                ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Under Review ({underReviewCount})
          </button>

          <button
            type="button"
            onClick={() => { setShowOutliersOnly(false); setStatusFilter('FLAGGED'); }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition border ${
              !showOutliersOnly && statusFilter === 'FLAGGED'
                ? 'bg-red-800 text-white border-red-800 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Flagged in Audit ({flaggedCount})
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search category, activity type, source, or data owner..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={scopeFilter}
              onChange={e => setScopeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Scopes</option>
              <option value="SCOPE_1">Scope 1 (Direct)</option>
              <option value="SCOPE_2">Scope 2 (Grid Electricity)</option>
              <option value="SCOPE_3">Scope 3 (Value Chain)</option>
            </select>

            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Periods</option>
              <option value="2025-Q1">2025-Q1</option>
              <option value="2024-Q4">2024-Q4</option>
              <option value="2024-Q3">2024-Q3</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALIDATED">Validated</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="FLAGGED">Flagged</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Carbon Ledger Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Scope & Period</th>
                <th className="py-2.5 px-3">Category & Activity</th>
                <th className="py-2.5 px-3">Activity Amount</th>
                <th className="py-2.5 px-3">Emission Factor</th>
                <th className="py-2.5 px-3">Calculated Emissions</th>
                <th className="py-2.5 px-3">Source & Owner</th>
                <th className="py-2.5 px-3">Audit Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No carbon data records match the active filters.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((r) => {
                  const evalInfo = outlierMap.get(r.id);
                  const isOutlier = evalInfo?.isOutlier || r.status === 'FLAGGED';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isOutlier ? 'bg-amber-50/20 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${scopeBadges[r.scope] || ''}`}>
                          {r.scope.replace('_', ' ')}
                        </span>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">{r.reportingPeriod}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{r.activityType}</span>
                          {isOutlier && (
                            <button
                              type="button"
                              onClick={() => setSelectedOutlierRecord(r)}
                              className="inline-flex items-center gap-1 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[9px] font-bold text-amber-900 hover:bg-amber-200 transition"
                              title="Click to inspect automated audit triage anomaly reasons"
                            >
                              <ShieldAlert className="h-2.5 w-2.5 text-amber-700" />
                              <span>Outlier ({evalInfo?.score ?? 75}%)</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{r.category}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 tabular-nums">
                        {r.activityAmount.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">{r.unit}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 tabular-nums">
                        {r.emissionFactor}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                          {r.calculatedEmissions.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">tCO2e</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 truncate max-w-[140px]">{r.source}</div>
                        <div className="text-[11px] text-slate-500">{r.dataOwner}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusBadges[r.status] || ''}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </div>
                        {isOutlier && r.status !== 'FLAGGED' && canEdit && (
                          <button
                            type="button"
                            onClick={() => handleUpdateRecordStatus(r.id, 'FLAGGED', 'Auto-flagged anomaly during triage')}
                            className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-red-700 transition"
                            title="Confirm outlier and flag in audit ledger"
                          >
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                            <span>Flag for Auditor</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOutlier && (
                            <button
                              type="button"
                              onClick={() => setSelectedOutlierRecord(r)}
                              className="rounded p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-800 transition"
                              title="Inspect Outlier Triage Details"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(r)}
                              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              title="Edit Record"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating / Editing Carbon Record */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? 'Edit Carbon Activity Record' : 'Log New Carbon Activity'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Quick Scope 1 & 2 Fuel / Energy Calculator Callout */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-medium">
                  <Calculator className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>Calculate emissions from fuel volume, therms, or electricity metrics</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScopeCalculatorModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 transition shrink-0 shadow-2xs"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Launch Calculator</span>
                </button>
              </div>

              {/* Factor Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Quick Select Standard Emission Factor (Optional)</label>
                <select
                  onChange={handleFactorSelect}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                >
                  <option value="">-- Choose from recognized EPA/DEFRA factors --</option>
                  {factors.map(f => (
                    <option key={f.id} value={f.id}>
                      [{f.scope}] {f.activityType} ({f.factorValue} {f.factorUnit} - {f.sourceReference})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Reporting Period</label>
                  <input
                    type="text"
                    required
                    value={form.reportingPeriod}
                    onChange={e => setForm({ ...form, reportingPeriod: e.target.value })}
                    placeholder="2025-Q1"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">GHG Scope</label>
                  <select
                    value={form.scope}
                    onChange={e => setForm({ ...form, scope: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="SCOPE_1">Scope 1 (Direct Fuel / Fugitive)</option>
                    <option value="SCOPE_2">Scope 2 (Purchased Electricity)</option>
                    <option value="SCOPE_3">Scope 3 (Upstream / Downstream)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Stationary Combustion"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Activity Type</label>
                  <input
                    type="text"
                    required
                    value={form.activityType}
                    onChange={e => setForm({ ...form, activityType: e.target.value })}
                    placeholder="Natural Gas Boiler"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Activity Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.activityAmount}
                    onChange={e => setForm({ ...form, activityAmount: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="therms, kWh, gallons, km"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Emission Factor Value</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.emissionFactor}
                    onChange={e => setForm({ ...form, emissionFactor: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="VALIDATED">Validated</option>
                    <option value="FLAGGED">Flagged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Primary Source Document</label>
                  <input
                    type="text"
                    required
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    placeholder="PG&E Utility Invoice #8829"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Data Owner / Submitter</label>
                  <input
                    type="text"
                    required
                    value={form.dataOwner}
                    onChange={e => setForm({ ...form, dataOwner: e.target.value })}
                    placeholder="Elena Rostova"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Math Box */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold">Calculated Emissions Math:</span>
                  <div className="mt-0.5 text-emerald-900 font-mono text-[11px]">
                    {form.activityAmount} {form.unit} × {form.emissionFactor} factor =
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-emerald-900 font-mono tabular-nums">{calculatedPreview.toLocaleString()}</span>
                  <span className="ml-1 text-[11px] font-semibold text-emerald-800">tCO2e</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Audit Notes & Methodological Remarks</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes for assurance auditor review..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  {editingId ? 'Save Record' : 'Record Emission Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Anomaly Inspection & Triage Modal */}
      {selectedOutlierRecord && (() => {
        const evalInfo = outlierMap.get(selectedOutlierRecord.id) || evaluateCarbonOutliers(selectedOutlierRecord, records);
        const peerCategoryRecords = records.filter(r => r.category === selectedOutlierRecord.category && r.id !== selectedOutlierRecord.id);
        const avgPeer = peerCategoryRecords.length > 0 
          ? peerCategoryRecords.reduce((sum, r) => sum + r.calculatedEmissions, 0) / peerCategoryRecords.length 
          : 0;
        const periodTotal = records
          .filter(r => r.reportingPeriod === selectedOutlierRecord.reportingPeriod)
          .reduce((sum, r) => sum + r.calculatedEmissions, 0);
        const shareOfPeriod = periodTotal > 0 ? (selectedOutlierRecord.calculatedEmissions / periodTotal) * 100 : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shrink-0 border border-amber-200">
                    <ShieldAlert className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Audit Anomaly Inspection & Triage
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        evalInfo.severity === 'HIGH' 
                          ? 'bg-red-50 text-red-900 border-red-200' 
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                        {evalInfo.severity} Risk Anomaly
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Record {selectedOutlierRecord.id} • {selectedOutlierRecord.activityType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOutlierRecord(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Anomaly Risk Score & Materiality Banner */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Automated Anomaly Score
                  </span>
                  <span className="font-mono text-base font-black text-amber-900">
                    {evalInfo.score} / 100
                  </span>
                </div>
                <div className="h-2 w-full bg-amber-200/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${evalInfo.severity === 'HIGH' ? 'bg-red-600' : 'bg-amber-600'}`}
                    style={{ width: `${evalInfo.score}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 text-slate-700">
                  <div className="bg-white/80 rounded-md p-2 border border-amber-200/60">
                    <span className="text-[10px] text-slate-500 block">Calculated Emissions</span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">{selectedOutlierRecord.calculatedEmissions} tCO2e</span>
                  </div>
                  <div className="bg-white/80 rounded-md p-2 border border-amber-200/60">
                    <span className="text-[10px] text-slate-500 block">Share of Period Inventory</span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">{shareOfPeriod.toFixed(1)}%</span>
                  </div>
                  <div className="bg-white/80 rounded-md p-2 border border-amber-200/60 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block">Current Ledger Status</span>
                    <span className={`inline-block mt-0.5 rounded border px-1.5 py-0.2 text-[10px] font-bold ${statusBadges[selectedOutlierRecord.status] || ''}`}>
                      {selectedOutlierRecord.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Anomaly Triggers List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4 text-amber-700" />
                  <span>Identified Statistical & Methodological Anomalies</span>
                </h4>
                <div className="space-y-2">
                  {evalInfo.flags.map((flag, idx) => (
                    <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs text-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Anomaly Finding #{idx + 1}</span>
                      </div>
                      <p className="text-slate-700 text-xs pl-5">{flag}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peer Comparison & Mathematical Traceability */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5 text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Activity Ledger Provenance & Calculation Verification
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Formula Verification:</span>
                    <div className="font-mono bg-white p-2 rounded border border-slate-200 mt-0.5 text-[11px] tabular-nums">
                      {selectedOutlierRecord.activityAmount.toLocaleString()} {selectedOutlierRecord.unit} × {selectedOutlierRecord.emissionFactor} = <span className="font-bold text-slate-900">{selectedOutlierRecord.calculatedEmissions} tCO2e</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Category Benchmark ({selectedOutlierRecord.category}):</span>
                    <div className="font-mono bg-white p-2 rounded border border-slate-200 mt-0.5 text-[11px] tabular-nums">
                      {peerCategoryRecords.length > 0 ? (
                        <>
                          Peer Avg: {avgPeer.toFixed(1)} tCO2e (Entry is{' '}
                          <span className={selectedOutlierRecord.calculatedEmissions > avgPeer ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                            {avgPeer > 0 ? `${Math.round(((selectedOutlierRecord.calculatedEmissions - avgPeer) / avgPeer) * 100)}% vs peer mean` : 'N/A'}
                          </span>)
                        </>
                      ) : (
                        <span>Single entry in category</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Primary Source Document:</span>
                    <span className="font-semibold text-slate-900">{selectedOutlierRecord.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Data Owner / Submitter:</span>
                    <span className="font-semibold text-slate-900">{selectedOutlierRecord.dataOwner}</span>
                  </div>
                </div>
                {selectedOutlierRecord.notes && (
                  <div className="mt-1 pt-2 border-t border-slate-200 text-slate-600">
                    <span className="font-bold text-slate-700">Audit Notes: </span>
                    <span>{selectedOutlierRecord.notes}</span>
                  </div>
                )}
              </div>

              {/* Recommended Action Checklist */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs text-emerald-950">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>Auditor Guidance & Assurance Recommendation</span>
                </span>
                <p className="text-emerald-900">{evalInfo.recommendedAction}</p>
              </div>

              {/* Auditor Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {canEdit && selectedOutlierRecord.status !== 'FLAGGED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateRecordStatus(selectedOutlierRecord.id, 'FLAGGED', 'Confirmed outlier anomaly by audit team triage')}
                      className="rounded-lg bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-800 transition shadow-2xs"
                    >
                      Flag for Audit Review
                    </button>
                  )}

                  {canEdit && selectedOutlierRecord.status !== 'UNDER_REVIEW' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateRecordStatus(selectedOutlierRecord.id, 'UNDER_REVIEW', 'Sent to facilities team for secondary statement verification')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Request Clarification (Under Review)
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleUpdateRecordStatus(selectedOutlierRecord.id, 'VALIDATED', 'Auditor verified variance with primary utility statement')}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition"
                    >
                      Override Anomaly & Validate
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        const rec = selectedOutlierRecord;
                        setSelectedOutlierRecord(null);
                        handleOpenEdit(rec);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit Entry Values
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOutlierRecord(null)}
                    className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Audit Screening Protocol Modal */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <ShieldCheck className="h-5 w-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ISO 14064-3 Outlier & Anomaly Screening Protocol
                  </h3>
                  <p className="text-xs text-slate-500">
                    Algorithmic screening rules applied automatically across the GHG accounting ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProtocolModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <p>
                CarbonFlow applies real-time automated statistical screening to every activity entry based on GHG Protocol Corporate Standard and ISO 14064-3 Limited Assurance specifications.
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">1</span>
                    <span>Materiality Threshold Rule (&gt;25% or &gt;100 tCO2e)</span>
                  </div>
                  <p className="text-slate-600 pl-6.5">
                    Any single activity line accounting for more than 25% of the reporting period’s total gross emissions or exceeding 100 tCO2e is marked as materially significant and requires primary meter statement reconciliation.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">2</span>
                    <span>High-GWP Factor Anomaly (Factor &ge; 1.5)</span>
                  </div>
                  <p className="text-slate-600 pl-6.5">
                    Refrigerants (e.g., R-410A) and specialized gases with high Global Warming Potential factors exceeding 1.5 tCO2e/unit undergo mandatory triage for certified EPA 608 technician tickets.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">3</span>
                    <span>Volumetric Spike Rule (&ge; 1,000,000 units)</span>
                  </div>
                  <p className="text-slate-600 pl-6.5">
                    Consumption activity amounts exceeding 1,000,000 units (e.g. kilowatt-hours or compute-hours) require interval smart metering feeds or authenticated cloud provider billing statements.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">4</span>
                    <span>Peer Category Statistical Variance (&gt;2.2x Category Mean)</span>
                  </div>
                  <p className="text-slate-600 pl-6.5">
                    Entries with calculated emissions deviating by more than +120% above the average of other entries within the same operational category are flagged as statistical distribution outliers.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">5</span>
                    <span>Audit Discrepancy & Triage Keyword Screening</span>
                  </div>
                  <p className="text-slate-600 pl-6.5">
                    Natural language screening flags entries containing variance notes, missing documentation citations, unverified meters, or ticket class discrepancies for priority auditor review.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProtocolModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close Protocol Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
