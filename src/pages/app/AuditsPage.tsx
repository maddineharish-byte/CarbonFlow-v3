import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  ChevronRight,
  ShieldCheck,
  Flame,
  FileCheck2,
  XCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditItem, CarbonRecord, EvidenceItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function AuditsPage() {
  const { role } = useAuth();
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [carbonList, setCarbonList] = useState<CarbonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(null);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [activeCarbonId, setActiveCarbonId] = useState<string | null>(null);
  const [validationForm, setValidationForm] = useState({
    status: 'VALIDATED',
    comments: 'Meets GHG Protocol quantification guidelines and matches utility bill.'
  });

  const [createForm, setCreateForm] = useState({
    auditName: '',
    auditPeriod: '2025-Q1',
    auditType: 'GHG_PROTOCOL_INVENTORY' as any,
    scope: 'SCOPE_1_2_3' as any,
    leadAuditor: 'Marcus Vance (Lead Auditor)',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    status: 'IN_PROGRESS' as any,
    description: '',
    carbonDataIds: [] as string[]
  });

  const canManageAudits = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [audRes, carbRes] = await Promise.all([
        api.listAudits(),
        api.listCarbonRecords()
      ]);
      setAudits(audRes);
      setCarbonList(carbRes.items);
      if (audRes.length > 0 && !selectedAudit) {
        setSelectedAudit(audRes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAudit(createForm);
      setCreateModalOpen(false);
      loadData();
      setSelectedAudit(created);
    } catch (err) {
      alert('Failed to initialize audit');
    }
  };

  const handleValidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit || !activeCarbonId) return;
    try {
      await api.validateAuditCarbon(
        selectedAudit.id,
        activeCarbonId,
        validationForm.status,
        validationForm.comments
      );
      setValidateModalOpen(false);
      loadData();
    } catch (err) {
      alert('Validation submission failed');
    }
  };

  const handleCloseAudit = async (audit: AuditItem) => {
    if (!confirm(`Are you sure you want to officially close and archive ${audit.auditName}?`)) return;
    try {
      await api.updateAudit(audit.id, {
        status: 'CLOSED',
        completionNotes: 'All scope categories validated. Zero unresolved critical non-conformances.'
      });
      loadData();
    } catch (err) {
      alert('Failed to close audit');
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-stone-100 text-stone-700 border-stone-200',
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200',
    UNDER_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    CLOSED: 'bg-stone-900 text-stone-100 border-stone-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Carbon Audit Management</h1>
          <p className="mt-1 text-xs text-stone-500">
            Formal audit engagements: Scope verification, line-by-line validation, evidence scrutiny, and closure.
          </p>
        </div>
        {canManageAudits && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Audit Engagement</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left List + Right Detail Drawer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Audits List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            Active & Archived Audits ({audits.length})
          </div>
          {audits.map((a) => {
            const isSelected = selectedAudit?.id === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelectedAudit(a)}
                className={`cursor-pointer rounded-xl border p-4 transition text-left ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/40 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusColors[a.status] || ''}`}>
                    {a.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">{a.auditPeriod}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-stone-900">{a.auditName}</h3>
                <div className="mt-1 text-xs text-stone-600 line-clamp-1">{a.description}</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100 pt-2">
                  <span>Lead: {a.leadAuditor}</span>
                  <span>Due: {a.dueDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Audit Engagement Details & Carbon Verification */}
        <div className="lg:col-span-7">
          {selectedAudit ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs space-y-6">
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusColors[selectedAudit.status] || ''}`}>
                      {selectedAudit.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-stone-500">Period: {selectedAudit.auditPeriod}</span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-bold text-stone-900">{selectedAudit.auditName}</h2>
                  <p className="mt-1 text-xs text-stone-600 leading-relaxed">{selectedAudit.description}</p>
                </div>
                {canManageAudits && selectedAudit.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleCloseAudit(selectedAudit)}
                    className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition"
                  >
                    Close Audit
                  </button>
                )}
              </div>

              {/* Engagement Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-lg border border-stone-100">
                <div>
                  <span className="text-stone-500">Audit Type:</span>
                  <div className="font-semibold text-stone-900">{selectedAudit.auditType.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <span className="text-stone-500">Assurance Scope:</span>
                  <div className="font-semibold text-stone-900">{selectedAudit.scope.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <span className="text-stone-500">Lead Auditor:</span>
                  <div className="font-semibold text-stone-900">{selectedAudit.leadAuditor}</div>
                </div>
                <div>
                  <span className="text-stone-500">Timeline:</span>
                  <div className="font-semibold text-stone-900">{selectedAudit.startDate} to {selectedAudit.dueDate}</div>
                </div>
              </div>

              {/* Line-by-Line Carbon Verification Section */}
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    Scoped Carbon Activity Items & Validation Sign-Off
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    {selectedAudit.linkedCarbonData?.length || 0} scoped items
                  </span>
                </div>

                <div className="mt-3 divide-y divide-stone-100 border rounded-lg overflow-hidden">
                  {(!selectedAudit.linkedCarbonData || selectedAudit.linkedCarbonData.length === 0) ? (
                    <div className="p-4 text-center text-xs text-stone-400">
                      No specific carbon records bound to this audit yet.
                    </div>
                  ) : (
                    selectedAudit.linkedCarbonData.map((item) => (
                      <div key={item.id} className="p-3.5 hover:bg-stone-50/50 transition text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                              {item.scope}
                            </span>
                            <span className="font-bold text-stone-900">{item.activityType}</span>
                            <span className="text-stone-500 font-mono">({item.calculatedEmissions} tCO2e)</span>
                          </div>
                          {item.reviewerComments && (
                            <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50/60 rounded px-2 py-1 border border-emerald-100">
                              <span className="font-semibold">Reviewer Verdict:</span> {item.reviewerComments}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                            item.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            item.status === 'NEEDS_REVIEW' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            item.status === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-stone-100 text-stone-700 border-stone-200'
                          }`}>
                            {item.status}
                          </span>
                          <button
                            onClick={() => {
                              setActiveCarbonId(item.carbonDataId);
                              setValidationForm({
                                status: item.status === 'PENDING' ? 'VALIDATED' : item.status,
                                comments: item.reviewerComments || 'Verified against primary evidence documents.'
                              });
                              setValidateModalOpen(true);
                            }}
                            className="rounded-lg border border-stone-300 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
                          >
                            Sign-off
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-400">
              Select an audit engagement on the left to review details.
            </div>
          )}
        </div>
      </div>

      {/* Initialize Audit Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">Initialize Carbon Audit Engagement</h3>
            <p className="mt-1 text-xs text-stone-600">
              Configure audit criteria, assurance framework, and bind inventory records.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Audit Engagement Title</label>
                <input
                  type="text"
                  required
                  value={createForm.auditName}
                  onChange={e => setCreateForm({ ...createForm, auditName: e.target.value })}
                  placeholder="e.g. FY2025 GHG Protocol Assurance Audit"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Audit Framework Type</label>
                  <select
                    value={createForm.auditType}
                    onChange={e => setCreateForm({ ...createForm, auditType: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="GHG_PROTOCOL_INVENTORY">GHG Protocol Corporate Standard</option>
                    <option value="THIRD_PARTY_ASSURANCE">ISO 14064-3 Limited Assurance</option>
                    <option value="INTERNAL_ANNUAL">Internal Annual Review</option>
                    <option value="SUPPLIER_SCOPE_3_VERIFICATION">Supplier Scope 3 Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Assurance Scope</label>
                  <select
                    value={createForm.scope}
                    onChange={e => setCreateForm({ ...createForm, scope: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="SCOPE_1_2_3">Scopes 1, 2, and 3</option>
                    <option value="SCOPE_1_2">Scopes 1 and 2 Only</option>
                    <option value="SCOPE_3_ONLY">Scope 3 Value Chain Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Lead Auditor / Team</label>
                  <input
                    type="text"
                    required
                    value={createForm.leadAuditor}
                    onChange={e => setCreateForm({ ...createForm, leadAuditor: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Audit Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Scope Description</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Define testing sample size, materiality thresholds, and assurance criteria..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Create Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Line-item Validation Modal */}
      {validateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">Line-Item Auditor Sign-Off</h3>
            <p className="mt-1 text-xs text-stone-600">
              Record formal assurance verification verdict for carbon activity record <code className="font-mono">{activeCarbonId}</code>.
            </p>

            <form onSubmit={handleValidateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Verdict</label>
                <select
                  value={validationForm.status}
                  onChange={e => setValidationForm({ ...validationForm, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="VALIDATED">VALIDATED - Satisfies testing criteria</option>
                  <option value="NEEDS_REVIEW">NEEDS REVIEW - Clarification or license required</option>
                  <option value="REJECTED">REJECTED - Non-conformance detected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Auditor Comments</label>
                <textarea
                  rows={3}
                  required
                  value={validationForm.comments}
                  onChange={e => setValidationForm({ ...validationForm, comments: e.target.value })}
                  placeholder="Notes explaining calculation corroboration and invoice verification..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setValidateModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Save Verification Verdict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
