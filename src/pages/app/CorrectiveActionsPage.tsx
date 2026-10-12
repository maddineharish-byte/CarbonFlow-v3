import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Shield,
  FileCheck2,
  User,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { CorrectiveActionItem, FindingItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function CorrectiveActionsPage() {
  const { role } = useAuth();
  const [actions, setActions] = useState<CorrectiveActionItem[]>([]);
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    findingId: '',
    actionTitle: '',
    description: '',
    ownerId: 'usr-emp-004',
    priority: 'HIGH' as any,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    status: 'IN_PROGRESS' as any,
    completionNotes: '',
    completionEvidenceId: ''
  });

  const canCreate = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER' || role === 'ANALYST';

  const loadData = async () => {
    setLoading(true);
    try {
      const [caRes, fndRes] = await Promise.all([
        api.listCorrectiveActions({
          priority: priorityFilter,
          status: statusFilter
        }),
        api.listFindings()
      ]);
      setActions(caRes);
      setFindings(fndRes);
      if (fndRes.length > 0 && !form.findingId) {
        setForm(prev => ({ ...prev, findingId: fndRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [priorityFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      findingId: findings[0]?.id || '',
      actionTitle: '',
      description: '',
      ownerId: 'usr-emp-004',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      status: 'OPEN',
      completionNotes: '',
      completionEvidenceId: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ca: CorrectiveActionItem) => {
    setEditingId(ca.id);
    setForm({
      findingId: ca.findingId,
      actionTitle: ca.actionTitle,
      description: ca.description,
      ownerId: ca.ownerId,
      priority: ca.priority,
      dueDate: ca.dueDate,
      status: ca.status,
      completionNotes: ca.completionNotes || '',
      completionEvidenceId: ca.completionEvidenceId || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCorrectiveAction(editingId, form);
      } else {
        await api.createCorrectiveAction(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleMarkComplete = async (ca: CorrectiveActionItem) => {
    const notes = prompt('Enter remediation completion summary notes:', 'Contractor attestation retrieved and verified.');
    if (!notes) return;
    try {
      await api.updateCorrectiveAction(ca.id, {
        ...ca,
        status: 'COMPLETED',
        completionNotes: notes
      });
      loadData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const priorityBadges: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-900 border-red-300 font-bold',
    HIGH: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    MEDIUM: 'bg-amber-100 text-amber-900 border-amber-300',
    LOW: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  const statusBadges: Record<string, string> = {
    OPEN: 'bg-red-50 text-red-800 border-red-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
    BLOCKED: 'bg-purple-50 text-purple-800 border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    VERIFIED: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    CLOSED: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Corrective Actions Management (CAPA)</h1>
          <p className="mt-1 text-xs text-stone-500">
            Closed-loop remediation tracking to address audit non-conformances before mandatory disclosure.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Assign Corrective Action</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
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
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="VERIFIED">Verified</option>
          </select>
        </div>
        <span className="text-xs text-stone-500">{actions.length} action plans</span>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {actions.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-400 text-xs">
            No corrective actions found.
          </div>
        ) : (
          actions.map((ca) => (
            <div
              key={ca.id}
              className={`rounded-xl border p-5 shadow-2xs transition text-xs space-y-3 bg-white ${
                ca.isOverdue ? 'border-red-300 bg-red-50/20' : 'border-stone-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[10px] ${priorityBadges[ca.priority] || ''}`}>
                    {ca.priority}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusBadges[ca.status] || ''}`}>
                    {ca.status}
                  </span>
                  {ca.isOverdue && (
                    <span className="rounded bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      OVERDUE
                    </span>
                  )}
                  <span className="font-mono text-stone-400 text-[11px]">{ca.id}</span>
                </div>

                <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                  <span>Due by: <strong className={ca.isOverdue ? 'text-red-700 font-bold' : 'text-stone-800'}>{ca.dueDate}</strong></span>
                  <button
                    onClick={() => handleOpenEdit(ca)}
                    className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    title="Edit Action"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-900">{ca.actionTitle}</h3>
                <p className="mt-1 text-stone-600 leading-relaxed">{ca.description}</p>
              </div>

              {/* Linked Finding */}
              <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-100 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Addresses Finding: <strong className="text-stone-900">{ca.findingTitle || ca.findingId}</strong></span>
                </div>
                <div className="text-stone-500">
                  Owner: <strong className="text-stone-800">{ca.ownerName || 'Assigned Specialist'}</strong>
                </div>
              </div>

              {ca.completionNotes && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-[11px] text-emerald-900">
                  <span className="font-bold">Completion Notes:</span> {ca.completionNotes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                {ca.status !== 'COMPLETED' && ca.status !== 'VERIFIED' && (
                  <button
                    onClick={() => handleMarkComplete(ca)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Corrective Action */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">{editingId ? 'Edit Corrective Action' : 'Assign Corrective Action'}</h3>
            <p className="mt-1 text-xs text-stone-600">
              Establish remediation scope, assign responsible owner, and set resolution deadline.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Target Audit Finding</label>
                <select
                  value={form.findingId}
                  onChange={e => setForm({ ...form, findingId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  {findings.map(f => (
                    <option key={f.id} value={f.id}>[{f.severity}] {f.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Action Plan Title</label>
                <input
                  type="text"
                  required
                  value={form.actionTitle}
                  onChange={e => setForm({ ...form, actionTitle: e.target.value })}
                  placeholder="e.g. Obtain Certified EPA 608 Contractor Attestation"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="URGENT">Urgent (Due &lt; 48 hours)</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
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
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="VERIFIED">Verified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Completion Deadline</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Assigned Responsible Owner</label>
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
                <label className="block text-xs font-semibold text-stone-700">Remediation Instructions & Scope</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail exact operational steps required to resolve the finding..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Completion Summary Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={form.completionNotes}
                  onChange={e => setForm({ ...form, completionNotes: e.target.value })}
                  placeholder="Summary of completed actions and uploaded resolution evidence..."
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
                  {editingId ? 'Save Action' : 'Assign Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
