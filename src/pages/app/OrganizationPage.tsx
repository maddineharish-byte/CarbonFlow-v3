import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Shield,
  Edit2,
  Check,
  X,
  AlertCircle,
  Mail,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Organization, User, UserRole } from '../../types';

export function OrganizationPage() {
  const { organization, role, setOrganization } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState<Partial<Organization>>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    title: 'Sustainability Analyst',
    role: 'ANALYST' as UserRole
  });

  const isAdmin = role === 'COMPANY_ADMIN';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const org = await api.getOrganization();
        setOrgForm(org);
        const mems = await api.getMembers();
        setMembers(mems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateOrganization(orgForm);
      setOrganization(updated);
      setEditingOrg(false);
    } catch (err) {
      alert('Failed to update organization');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await api.inviteUser(inviteForm);
      setMembers([...members, newUser]);
      setInviteModalOpen(false);
      setInviteForm({ email: '', fullName: '', title: 'Sustainability Analyst', role: 'ANALYST' });
    } catch (err) {
      alert('Failed to invite user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateRole(userId, newRole);
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole } : m));
    } catch (err) {
      alert('Failed to change role');
    }
  };

  const roleColors: Record<UserRole, string> = {
    COMPANY_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    SUSTAINABILITY_MANAGER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ANALYST: 'bg-blue-100 text-blue-800 border-blue-200',
    EMPLOYEE: 'bg-stone-100 text-stone-800 border-stone-200'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Organization & Member Governance</h1>
          <p className="mt-1 text-xs text-stone-500">
            Corporate operational boundary parameters, active reporting cycles, and user role management.
          </p>
        </div>
        {isAdmin && !editingOrg && (
          <button
            onClick={() => setEditingOrg(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Organization</span>
          </button>
        )}
      </div>

      {/* Organization Details Card */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-700" />
          Enterprise Entity Profile
        </h2>

        {editingOrg ? (
          <form onSubmit={handleSaveOrg} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Organization Legal Name</label>
                <input
                  type="text"
                  required
                  value={orgForm.name || ''}
                  onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Industry Sector</label>
                <input
                  type="text"
                  required
                  value={orgForm.industry || ''}
                  onChange={e => setOrgForm({ ...orgForm, industry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Country of Incorporation</label>
                <input
                  type="text"
                  required
                  value={orgForm.country || ''}
                  onChange={e => setOrgForm({ ...orgForm, country: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Operating Locations</label>
                <input
                  type="text"
                  value={orgForm.location || ''}
                  onChange={e => setOrgForm({ ...orgForm, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Current Reporting Period Cycle</label>
                <input
                  type="text"
                  required
                  value={orgForm.reportingPeriod || '2025'}
                  onChange={e => setOrgForm({ ...orgForm, reportingPeriod: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700">Organizational Scope & Narrative Description</label>
                <textarea
                  rows={2}
                  value={orgForm.description || ''}
                  onChange={e => setOrgForm({ ...orgForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingOrg(false)}
                className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-lg bg-stone-50 p-3 border border-stone-100">
              <span className="text-stone-500">Legal Entity</span>
              <div className="mt-1 font-bold text-stone-900 text-sm">{organization?.name}</div>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 border border-stone-100">
              <span className="text-stone-500">Industry</span>
              <div className="mt-1 font-semibold text-stone-900">{organization?.industry}</div>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 border border-stone-100">
              <span className="text-stone-500">Country & HQ</span>
              <div className="mt-1 font-semibold text-stone-900">{organization?.country} ({organization?.location || 'Global'})</div>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 border border-stone-100">
              <span className="text-stone-500">Active Reporting Period</span>
              <div className="mt-1 font-semibold text-emerald-800">{organization?.reportingPeriod || '2025'}</div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 rounded-lg bg-stone-50 p-3 border border-stone-100">
              <span className="text-stone-500">Inventory Scope Description</span>
              <div className="mt-1 text-stone-700 leading-relaxed">{organization?.description || 'Operational control boundary for corporate GHG emissions auditing.'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Member Management */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              Organization Members & Role Permissions
            </h2>
            <p className="text-xs text-stone-500">Enforce least privilege: Company Admin, Sustainability Manager, Analyst, Employee</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </button>
          )}
        </div>

        {/* Member Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Corporate Title</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Status</th>
                {isAdmin && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-stone-900">{m.fullName}</div>
                    <div className="text-[11px] text-stone-500">{m.email}</div>
                  </td>
                  <td className="py-3 px-3 text-stone-700">{m.title || 'Team Member'}</td>
                  <td className="py-3 px-3">
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                        className={`rounded border px-2 py-1 text-[11px] font-semibold outline-none ${roleColors[m.role]}`}
                      >
                        <option value="COMPANY_ADMIN">Company Admin</option>
                        <option value="SUSTAINABILITY_MANAGER">Sustainability Manager</option>
                        <option value="ANALYST">Analyst</option>
                        <option value="EMPLOYEE">Employee</option>
                      </select>
                    ) : (
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${roleColors[m.role]}`}>
                        {m.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      ACTIVE
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-3 text-right text-stone-500">
                      <span className="text-[11px] text-stone-400">Enforced</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">Invite New Organization Member</h3>
            <p className="mt-1 text-xs text-stone-600">
              Invite a user and grant role-based permissions in this organization.
            </p>

            <form onSubmit={handleInviteUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.fullName}
                  onChange={e => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                  placeholder="Jordan Lee"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="j.lee@organization.com"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Job Title</label>
                <input
                  type="text"
                  value={inviteForm.title}
                  onChange={e => setInviteForm({ ...inviteForm, title: e.target.value })}
                  placeholder="Senior Environmental Auditor"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Assigned Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="SUSTAINABILITY_MANAGER">Sustainability Manager (Audits, findings, verification)</option>
                  <option value="ANALYST">Analyst (Data entry, flight logs, calculations)</option>
                  <option value="EMPLOYEE">Employee (Meter uploads, corrective actions)</option>
                  <option value="COMPANY_ADMIN">Company Admin (Full organization settings & roles)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
