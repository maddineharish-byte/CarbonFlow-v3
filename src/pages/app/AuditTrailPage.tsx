import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';

export function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(entityFilter);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entityFilter]);

  const actionColors: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-800 border-blue-200',
    DELETE: 'bg-red-50 text-red-800 border-red-200',
    EVIDENCE_VERIFY: 'bg-teal-50 text-teal-800 border-teal-200',
    AUDIT_STATUS_CHANGE: 'bg-purple-50 text-purple-800 border-purple-200',
    LOGIN: 'bg-stone-100 text-stone-700 border-stone-200',
    REGISTER: 'bg-amber-50 text-amber-800 border-amber-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Append-Only Audit Trail Ledger</h1>
          <p className="mt-1 text-xs text-stone-500">
            Append-only chronological record of platform transactions, permission escalations, evidence sign-offs, and data changes.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-700">Filter Entity Type:</span>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="CARBON_DATA">Carbon Data</option>
            <option value="EVIDENCE">Evidence Ingestion & Verification</option>
            <option value="AUDIT">Audit Engagement Transitions</option>
            <option value="FINDING">Audit Findings</option>
            <option value="CORRECTIVE_ACTION">Corrective Actions</option>
            <option value="ORGANIZATION">Organization Governance</option>
            <option value="AUTH">Authentication Events</option>
          </select>
        </div>
        <span className="text-xs text-stone-500">{logs.length} logged events</span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor / Principal</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Entity Scope</th>
                <th className="py-2.5 px-3">Target Entity ID</th>
                <th className="py-2.5 px-3">Transaction Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <div className="font-semibold text-stone-900">{log.actorName}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{log.actorEmail}</div>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${actionColors[log.action] || 'bg-stone-100 text-stone-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-800 font-sans font-semibold">
                    {log.entityType}
                  </td>
                  <td className="py-3 px-3 text-stone-500 truncate max-w-[120px]">
                    {log.entityId}
                  </td>
                  <td className="py-3 px-3 text-stone-600 max-w-xs truncate" title={log.metadata}>
                    {log.metadata || '{}'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
