import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck2,
  ClipboardList,
  Edit2,
  Scale
} from 'lucide-react';
import { api } from '../../services/api';
import { ComplianceItem, AuditItem, EvidenceItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function CompliancePage() {
  const { role } = useAuth();
  const [requirements, setRequirements] = useState<ComplianceItem[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [frameworkFilter, setFrameworkFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    requirementCode: 'GHG-CH4',
    framework: 'GHG_PROTOCOL' as any,
    requirementName: '',
    description: '',
    applicability: 'MANDATORY' as any,
    ownerId: 'usr-mgr-002',
    status: 'IN_PROGRESS' as any,
    dueDate: '2025-06-30',
    linkedEvidenceId: '',
    linkedAuditId: '',
    notes: ''
  });

  const canEdit = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, audRes, eviRes] = await Promise.all([
        api.listCompliance({
          framework: frameworkFilter,
          status: statusFilter,
          query: searchQuery
        }),
        api.listAudits(),
        api.listEvidence()
      ]);
      setRequirements(compRes);
      setAudits(audRes);
      setEvidenceList(eviRes.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [frameworkFilter, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      requirementCode: 'REQ-' + Math.floor(Math.random() * 900 + 100),
      framework: 'GHG_PROTOCOL',
      requirementName: '',
      description: '',
      applicability: 'MANDATORY',
      ownerId: 'usr-mgr-002',
      status: 'IN_PROGRESS',
      dueDate: '2025-06-30',
      linkedEvidenceId: '',
      linkedAuditId: audits[0]?.id || '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: ComplianceItem) => {
    setEditingId(c.id);
    setForm({
      requirementCode: c.requirementCode,
      framework: c.framework,
      requirementName: c.requirementName,
      description: c.description,
      applicability: c.applicability,
      ownerId: c.ownerId,
      status: c.status,
      dueDate: c.dueDate || '',
      linkedEvidenceId: c.linkedEvidenceId || '',
      linkedAuditId: c.linkedAuditId || '',
      notes: c.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCompliance(editingId, form);
      } else {
        await api.createCompliance(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const statusColors: Record<string, string> = {
    COMPLIANT: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    PARTIALLY_COMPLIANT: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
    NON_COMPLIANT: 'bg-red-50 text-red-800 border-red-300 font-bold',
    NOT_STARTED: 'bg-stone-100 text-stone-700 border-stone-200',
    NOT_APPLICABLE: 'bg-stone-100 text-stone-500 border-stone-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Regulatory & Voluntary Compliance Scorecard</h1>
          <p className="mt-1 text-xs text-stone-500">
            Cross-framework traceability: GHG Protocol, ISO 14064, CSRD ESRS E1, SEC Rules, and California SB 253.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Map Requirement</span>
          </button>
        )}
      </div>

      {/* Legal disclaimer banner */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600 flex items-center gap-3">
        <Scale className="h-4 w-4 text-emerald-800 shrink-0" />
        <div>
          <span className="font-semibold text-stone-900">Compliance Authority Disclaimer:</span> CarbonFlow provides workflow and evidence structuring. Organizations remain solely responsible for determining statutory standards and legal compliance applicable to their jurisdiction.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search requirement code or standard title..."
            className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={frameworkFilter}
            onChange={e => setFrameworkFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Frameworks</option>
            <option value="GHG_PROTOCOL">GHG Protocol</option>
            <option value="ISO_14064_1">ISO 14064-1</option>
            <option value="CSRD_ESRS_E1">CSRD / ESRS E1</option>
            <option value="SEC_CLIMATE">SEC Climate Rules</option>
            <option value="CALIFORNIA_SB_253">California SB 253</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* Compliance Items Grid */}
      <div className="grid grid-cols-1 gap-4">
        {requirements.map((req) => (
          <div key={req.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-emerald-300 transition text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-stone-900 text-white font-mono px-2 py-0.5 text-[10px] font-bold">
                  {req.requirementCode}
                </span>
                <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  {req.framework.replace(/_/g, ' ')}
                </span>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusColors[req.status] || ''}`}>
                  {req.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                <span>Applicability: <strong className="text-stone-800">{req.applicability}</strong></span>
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(req)}
                    className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    title="Edit Requirement"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-stone-900">{req.requirementName}</h3>
              <p className="mt-1 text-stone-600 leading-relaxed">{req.description}</p>
            </div>

            {/* Evidence & Audit Traceability Link Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-[11px]">
              {req.linkedEvidenceId && (
                <div className="flex items-center gap-1.5 text-stone-600 bg-stone-50 px-2.5 py-1 rounded border border-stone-100">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Substantiating Evidence: <strong className="text-stone-900">{req.linkedEvidenceName || req.linkedEvidenceId}</strong></span>
                </div>
              )}
              {req.linkedAuditId && (
                <div className="flex items-center gap-1.5 text-stone-600 bg-stone-50 px-2.5 py-1 rounded border border-stone-100">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-700" />
                  <span>Verified in Audit: <strong className="text-stone-900">{req.linkedAuditName || req.linkedAuditId}</strong></span>
                </div>
              )}
              <div className="ml-auto text-stone-500">
                Lead Owner: <strong className="text-stone-800">{req.ownerName || 'ESG Controller'}</strong>
              </div>
            </div>

            {req.notes && (
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-2.5 text-[11px] text-stone-700">
                <span className="font-semibold text-stone-900">Notes & Disclosure Trace:</span> {req.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Compliance */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold">{editingId ? 'Edit Compliance Item' : 'Map New Compliance Requirement'}</h3>
            <p className="mt-1 text-xs text-stone-600">
              Bind reporting mandates to verified carbon entries and assurance engagements.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Framework</label>
                  <select
                    value={form.framework}
                    onChange={e => setForm({ ...form, framework: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="GHG_PROTOCOL">GHG Protocol Corporate Standard</option>
                    <option value="ISO_14064_1">ISO 14064-1 Specification</option>
                    <option value="CSRD_ESRS_E1">CSRD / ESRS E1 Climate</option>
                    <option value="SEC_CLIMATE">SEC Climate Rules</option>
                    <option value="CALIFORNIA_SB_253">California SB 253</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Requirement Code</label>
                  <input
                    type="text"
                    required
                    value={form.requirementCode}
                    onChange={e => setForm({ ...form, requirementCode: e.target.value })}
                    placeholder="e.g. GHG-CH4"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Requirement Title</label>
                <input
                  type="text"
                  required
                  value={form.requirementName}
                  onChange={e => setForm({ ...form, requirementName: e.target.value })}
                  placeholder="e.g. Scope 1 Direct Stationary Fuel Accounting"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Applicability</label>
                  <select
                    value={form.applicability}
                    onChange={e => setForm({ ...form, applicability: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="MANDATORY">Mandatory / Regulatory</option>
                    <option value="VOLUNTARY">Voluntary / Stakeholder</option>
                    <option value="UNDER_EVALUATION">Under Legal Evaluation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="COMPLIANT">Compliant</option>
                    <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="NON_COMPLIANT">Non-Compliant</option>
                    <option value="NOT_APPLICABLE">Not Applicable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Linked Evidence File (Optional)</label>
                  <select
                    value={form.linkedEvidenceId}
                    onChange={e => setForm({ ...form, linkedEvidenceId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- None --</option>
                    {evidenceList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.evidenceName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Linked Audit Engagement (Optional)</label>
                  <select
                    value={form.linkedAuditId}
                    onChange={e => setForm({ ...form, linkedAuditId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- None --</option>
                    {audits.map(a => (
                      <option key={a.id} value={a.id}>{a.auditName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Requirement Standard Text</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Official framework clause description..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Internal Audit & Methodology Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Document how corporate procedures satisfy this standard..."
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
                  {editingId ? 'Save Requirement' : 'Map Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
