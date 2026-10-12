import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  FileText,
  Shield,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { EvidenceItem, CarbonRecord, AuditItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function EvidencePage() {
  const { role } = useAuth();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [carbonList, setCarbonList] = useState<CarbonRecord[]>([]);
  const [auditList, setAuditList] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Forms
  const [uploadForm, setUploadForm] = useState({
    evidenceName: '',
    evidenceType: 'UTILITY_STATEMENT' as any,
    reportingPeriod: '2025-Q1',
    source: 'Utility Customer Portal',
    owner: 'David Kim',
    description: '',
    linkedCarbonDataId: '',
    linkedAuditId: ''
  });

  const [verifyVerdict, setVerifyVerdict] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifyNotes, setVerifyNotes] = useState('');

  const canVerify = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [eviRes, carbRes, audRes] = await Promise.all([
        api.listEvidence({
          period: periodFilter,
          status: statusFilter,
          type: typeFilter,
          query: searchQuery
        }),
        api.listCarbonRecords(),
        api.listAudits()
      ]);
      setEvidenceList(eviRes.items);
      setCarbonList(carbRes.items);
      setAuditList(audRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodFilter, statusFilter, typeFilter, searchQuery]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvidence(uploadForm);
      setUploadModalOpen(false);
      setUploadForm({
        evidenceName: '',
        evidenceType: 'UTILITY_STATEMENT',
        reportingPeriod: '2025-Q1',
        source: 'Utility Customer Portal',
        owner: 'David Kim',
        description: '',
        linkedCarbonDataId: '',
        linkedAuditId: ''
      });
      loadData();
    } catch (err: any) {
      alert('Upload failed');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.verifyEvidence(selectedItem.id, verifyVerdict, verifyNotes);
      setVerifyModalOpen(false);
      setSelectedItem(null);
      setVerifyNotes('');
      loadData();
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this evidence record?')) return;
    try {
      await api.deleteEvidence(id);
      loadData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const typeLabels: Record<string, string> = {
    ELECTRICITY_BILL: 'Electricity Bill',
    FUEL_INVOICE: 'Fuel Invoice',
    UTILITY_STATEMENT: 'Utility Statement',
    TRANSPORT_RECORD: 'Transport Record',
    SUPPLIER_DECLARATION: 'Supplier Declaration',
    RENEWABLE_CERTIFICATE: 'Renewable Certificate (REC)',
    SPREADSHEET: 'Spreadsheet Extract',
    PDF_REPORT: 'PDF Report'
  };

  const statusColors: Record<string, string> = {
    VERIFIED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    REJECTED: 'bg-red-50 text-red-800 border-red-200',
    EXPIRED: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Evidentiary Document Repository</h1>
          <p className="mt-1 text-xs text-stone-500">
            Primary bills, invoices, fuel manifests, and renewable certificates tied to authoritative carbon ledger records.
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Audit Evidence</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search document name, source, or owner..."
            className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Evidence Types</option>
            <option value="UTILITY_STATEMENT">Utility Statement</option>
            <option value="FUEL_INVOICE">Fuel Invoice</option>
            <option value="RENEWABLE_CERTIFICATE">Renewable Certificate (REC)</option>
            <option value="SUPPLIER_DECLARATION">Supplier Declaration</option>
            <option value="TRANSPORT_RECORD">Transport Record</option>
          </select>

          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="ALL">All Periods</option>
            <option value="2025-Q1">2025-Q1</option>
            <option value="2024-Q4">2024-Q4</option>
          </select>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Evidence Document</th>
                <th className="py-2.5 px-3">Type & Period</th>
                <th className="py-2.5 px-3">Primary Source</th>
                <th className="py-2.5 px-3">Linked Records</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Auditor Verification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No evidence items found.
                  </td>
                </tr>
              ) : (
                evidenceList.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{e.evidenceName}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">Uploaded by {e.owner}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-stone-800">{typeLabels[e.evidenceType] || e.evidenceType}</div>
                      <div className="text-[11px] text-stone-500">{e.reportingPeriod}</div>
                    </td>
                    <td className="py-3 px-3 text-stone-700">
                      <div>{e.source}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {e.linkedCarbonDataId && (
                          <div className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono text-stone-700 mr-1">
                            Activity: {e.linkedCarbonDataId}
                          </div>
                        )}
                        {e.linkedAuditId && (
                          <div className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono text-stone-700">
                            Audit: {e.linkedAuditId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusColors[e.status] || ''}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {e.status === 'VERIFIED' ? (
                        <div className="text-[11px] text-emerald-800">
                          <span className="font-semibold">Sign-off Logged</span>
                          <div className="text-stone-500 text-[10px] truncate max-w-[150px]">{e.verificationNotes}</div>
                        </div>
                      ) : e.status === 'REJECTED' ? (
                        <div className="text-[11px] text-red-800">
                          <span className="font-semibold">Rejected</span>
                          <div className="text-stone-500 text-[10px] truncate max-w-[150px]">{e.verificationNotes}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-medium">Pending Auditor Review</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(e);
                            setPreviewModalOpen(true);
                          }}
                          className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          title="Preview Document Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canVerify && (
                          <button
                            onClick={() => {
                              setSelectedItem(e);
                              setVerifyNotes(e.verificationNotes || '');
                              setVerifyVerdict('VERIFIED');
                              setVerifyModalOpen(true);
                            }}
                            className="rounded p-1 text-stone-500 hover:bg-emerald-50 hover:text-emerald-800"
                            title="Auditor Sign-off"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canVerify && (
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Evidence Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">Upload New Evidentiary Document</h3>
            <p className="mt-1 text-xs text-stone-600">
              Attach invoices, utility statements, or contractor declarations to substantiate greenhouse gas accounting.
            </p>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadForm.evidenceName}
                  onChange={e => setUploadForm({ ...uploadForm, evidenceName: e.target.value })}
                  placeholder="e.g. PG&E Natural Gas Invoice - March 2025"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Document Type</label>
                  <select
                    value={uploadForm.evidenceType}
                    onChange={e => setUploadForm({ ...uploadForm, evidenceType: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="UTILITY_STATEMENT">Utility Statement</option>
                    <option value="FUEL_INVOICE">Fuel Invoice</option>
                    <option value="RENEWABLE_CERTIFICATE">Renewable Certificate (REC)</option>
                    <option value="SUPPLIER_DECLARATION">Supplier Declaration</option>
                    <option value="TRANSPORT_RECORD">Transport Record</option>
                    <option value="SPREADSHEET">Spreadsheet Extract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Reporting Period</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.reportingPeriod}
                    onChange={e => setUploadForm({ ...uploadForm, reportingPeriod: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Source Authority / Vendor</label>
                <input
                  type="text"
                  required
                  value={uploadForm.source}
                  onChange={e => setUploadForm({ ...uploadForm, source: e.target.value })}
                  placeholder="e.g. Pacific Gas and Electric Utility Portal"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Link to Carbon Activity (Optional)</label>
                  <select
                    value={uploadForm.linkedCarbonDataId}
                    onChange={e => setUploadForm({ ...uploadForm, linkedCarbonDataId: e.target.value })}
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
                  <label className="block text-xs font-semibold text-stone-700">Link to Audit (Optional)</label>
                  <select
                    value={uploadForm.linkedAuditId}
                    onChange={e => setUploadForm({ ...uploadForm, linkedAuditId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- None --</option>
                    {auditList.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.auditName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Description & File Notes</label>
                <textarea
                  rows={2}
                  value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="e.g. Meter #PG-499201 covering Jan-Mar 2025 building consumption..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Upload & Register Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Evidence Modal */}
      {verifyModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">Auditor Evidence Verification</h3>
            <p className="mt-1 text-xs text-stone-600">
              Formally sign off on the authenticity and meter alignment for <span className="font-semibold">{selectedItem.evidenceName}</span>.
            </p>

            <form onSubmit={handleVerifySubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Verification Verdict</label>
                <select
                  value={verifyVerdict}
                  onChange={e => setVerifyVerdict(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="VERIFIED">VERIFIED - Document meets assurance criteria</option>
                  <option value="REJECTED">REJECTED - Missing stamps or meter mismatch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Auditor Notes & Verification Rationales</label>
                <textarea
                  rows={3}
                  required
                  value={verifyNotes}
                  onChange={e => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Cross-checked with billing portal records; meter numbers match activity entry exactly."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Submit Sign-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold">{selectedItem.evidenceName}</h3>
              <button onClick={() => setPreviewModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-100">
                <div>
                  <span className="text-stone-500">Document Type:</span>
                  <div className="font-semibold text-stone-900">{typeLabels[selectedItem.evidenceType] || selectedItem.evidenceType}</div>
                </div>
                <div>
                  <span className="text-stone-500">Verification Status:</span>
                  <div className="font-semibold text-stone-900">{selectedItem.status}</div>
                </div>
                <div>
                  <span className="text-stone-500">Source:</span>
                  <div className="font-semibold text-stone-900">{selectedItem.source}</div>
                </div>
                <div>
                  <span className="text-stone-500">Uploaded By:</span>
                  <div className="font-semibold text-stone-900">{selectedItem.owner}</div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-stone-700">Description & Context:</span>
                <p className="mt-1 text-stone-600 leading-relaxed bg-white border rounded p-2.5">
                  {selectedItem.description || 'No description provided.'}
                </p>
              </div>

              {selectedItem.verificationNotes && (
                <div>
                  <span className="font-semibold text-emerald-900">Auditor Sign-off Notes:</span>
                  <p className="mt-1 text-emerald-800 leading-relaxed bg-emerald-50 border border-emerald-200 rounded p-2.5">
                    {selectedItem.verificationNotes}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <span className="text-stone-500 text-[11px]">Secure Tenant Storage URI:</span>
                <div className="font-mono text-[10px] text-stone-600 bg-stone-100 p-2 rounded truncate mt-0.5">
                  {selectedItem.fileUrl || 'https://storage.carbonflow.io/vault/protected/' + selectedItem.id + '.pdf'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-stone-100">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
