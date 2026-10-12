import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Flame,
  FileCheck2,
  ClipboardList
} from 'lucide-react';
import { api } from '../../services/api';
import { FindingItem, AuditItem, CarbonRecord, EvidenceItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function FindingsPage() {
  const { role } = useAuth();
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [carbonList, setCarbonList] = useState<CarbonRecord[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    auditId: '',
    title: '',
    description: '',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    source: '',
    relatedCarbonDataId: '',
    relatedEvidenceId: '',
    ownerId: 'usr-emp-004',
    status: 'OPEN' as any,
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    resolutionNotes: ''
  });

  const canCreate = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [fndRes, audRes, carbRes, eviRes] = await Promise.all([
        api.listFindings({
          severity: severityFilter,
          status: statusFilter,
          query: searchQuery
        }),
        api.listAudits(),
        api.listCarbonRecords(),
        api.listEvidence()
      ]);
      setFindings(fndRes);
      setAudits(audRes);
      setCarbonList(carbRes.items);
      setEvidenceList(eviRes.items);
      if (audRes.length > 0 && !form.auditId) {
        setForm(prev => ({ ...prev, auditId: audRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [severityFilter, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      auditId: audits[0]?.id || '',
      title: '',
      description: '',
      severity: 'MEDIUM',
      source: 'Auditor Sample Testing',
      relatedCarbonDataId: '',
      relatedEvidenceId: '',
      ownerId: 'usr-emp-004',
      status: 'OPEN',
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      resolutionNotes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (f: FindingItem) => {
    setEditingId(f.id);
    setForm({
      auditId: f.auditId,
      title: f.title,
      description: f.description,
      severity: f.severity,
      source: f.source,
      relatedCarbonDataId: f.relatedCarbonDataId || '',
      relatedEvidenceId: f.relatedEvidenceId || '',
      ownerId: f.ownerId,
      status: f.status,
      dueDate: f.dueDate,
      resolutionNotes: f.resolutionNotes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateFinding(editingId, form);
      } else {
        await api.createFinding(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this finding?')) return;
    try {
      await api.deleteFinding(id);
      loadData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const severityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300 font-bold',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
    LOW: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-red-50 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
    RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    ACCEPTED_RISK: 'bg-purple-50 text-purple-800 border-purple-200',
    CLOSED: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Audit Findings Register</h1>
          <p className="mt-1 text-xs text-stone-500">
            Discrepancies, missing evidence attachments, and calculation variances uncovered during GHG audits.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Record Finding</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search finding title, description, or root cause source..."
            className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="grid grid-cols-1 gap-4">
        {findings.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-400 text-xs">
            No audit findings logged.
          </div>
        ) : (
          findings.map((f) => (
            <div key={f.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-emerald-300 transition text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[10px] ${severityColors[f.severity] || ''}`}>
                    {f.severity}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusColors[f.status] || ''}`}>
                    {f.status}
                  </span>
                  <span className="font-mono text-stone-400 text-[11px]">{f.id}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                  <span>Target Due: <strong className="text-stone-800">{f.dueDate}</strong></span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(f)}
                      className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                      title="Edit Finding"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {canCreate && (
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                        title="Delete Finding"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-stone-600 leading-relaxed">{f.description}</p>
              </div>

              {/* Traceability relationships badge bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-[11px]">
                <div className="flex items-center gap-1 text-stone-500">
                  <ClipboardList className="h-3.5 w-3.5 text-stone-400" />
                  <span>Audit: <strong className="text-stone-800">{f.auditName || f.auditId}</strong></span>
                </div>
                {f.relatedCarbonDataId && (
                  <div className="flex items-center gap-1 text-stone-500 ml-2">
                    <Flame className="h-3.5 w-3.5 text-amber-600" />
                    <span>Carbon Entry: <strong className="text-stone-800 font-mono">{f.relatedCarbonDataId}</strong></span>
                  </div>
                )}
                {f.relatedEvidenceId && (
                  <div className="flex items-center gap-1 text-stone-500 ml-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-teal-600" />
                    <span>Evidence File: <strong className="text-stone-800 font-mono">{f.relatedEvidenceId}</strong></span>
                  </div>
                )}
                <div className="ml-auto text-stone-500">
                  Assignee: <strong className="text-stone-800">{f.ownerName || 'David Kim'}</strong>
                </div>
              </div>

              {f.resolutionNotes && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-[11px] text-emerald-900">
                  <span className="font-bold">Resolution Notes:</span> {f.resolutionNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Record Finding Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold">{editingId ? 'Edit Audit Finding' : 'Record New Audit Finding'}</h3>
            <p className="mt-1 text-xs text-stone-600">
              Log a non-conformance, evidence gap, or estimation anomaly detected in the carbon inventory.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Audit Engagement</label>
                <select
                  value={form.auditId}
                  onChange={e => setForm({ ...form, auditId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  {audits.map(a => (
                    <option key={a.id} value={a.id}>{a.auditName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Finding Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Unverified refrigerant leakage estimation"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Severity Level</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="CRITICAL">Critical (Non-compliance with protocol)</option>
                    <option value="HIGH">High (Material variance &gt; 5%)</option>
                    <option value="MEDIUM">Medium (Documentation deficiency)</option>
                    <option value="LOW">Low (Minor formatting or note)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Remediation Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="ACCEPTED_RISK">Accepted Risk</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Root Cause Source</label>
                <input
                  type="text"
                  required
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. Carrier HVAC technician slip missing EPA license number"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Related Carbon Record (Optional)</label>
                  <select
                    value={form.relatedCarbonDataId}
                    onChange={e => setForm({ ...form, relatedCarbonDataId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- None --</option>
                    {carbonList.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.scope}] {c.activityType} ({c.calculatedEmissions} tCO2e)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Related Evidence File (Optional)</label>
                  <select
                    value={form.relatedEvidenceId}
                    onChange={e => setForm({ ...form, relatedEvidenceId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- None --</option>
                    {evidenceList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.evidenceName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Resolution Due Date</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Remediation Owner</label>
                  <input
                    type="text"
                    required
                    value={form.ownerId}
                    onChange={e => setForm({ ...form, ownerId: e.target.value })}
                    placeholder="usr-emp-004 (David Kim)"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Detailed Description & Audit Remarks</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain exactly why this item violates GHG Protocol assurance rules..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Resolution Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={form.resolutionNotes}
                  onChange={e => setForm({ ...form, resolutionNotes: e.target.value })}
                  placeholder="Document actions taken to remediate finding..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  {editingId ? 'Save Finding' : 'Log Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
