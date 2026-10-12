import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Flame,
  FileCheck2,
  ClipboardList,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  FileSpreadsheet,
  History,
  DatabaseBackup,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Shield,
  Sparkles,
  Check,
  Compass,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { api } from '../../services/api';

interface AppLayoutProps {
  currentTab: string;
  setTab: (tab: string) => void;
  navigatePublic: (path: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentTab, setTab, navigatePublic, children }: AppLayoutProps) {
  const { user, organization, role, logout, switchRole } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.getNotifications();
        setNotifications(res.items);
        setUnreadCount(res.unreadCount);
      } catch (e) {
        // quiet fallback
      }
    }
    loadNotifications();
  }, [currentTab]);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Structured Nav Groups for top MNC readability
  const navSections = [
    {
      title: 'INTELLIGENCE & DATA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] },
        { id: 'ai-assistant', label: 'Gemini ESG Intelligence', icon: Sparkles, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] },
        { id: 'carbon-data', label: 'Carbon Ledger', icon: Flame, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] },
        { id: 'travel', label: 'Travel & Mobility', icon: Compass, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] },
        { id: 'evidence', label: 'Evidence Repository', icon: FileCheck2, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] }
      ]
    },
    {
      title: 'AUDIT & REMEDIATION',
      items: [
        { id: 'audits', label: 'Audits', icon: ClipboardList, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] },
        { id: 'findings', label: 'Findings', icon: AlertTriangle, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] },
        { id: 'corrective-actions', label: 'Corrective Actions (CAPA)', icon: CheckSquare, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] }
      ]
    },
    {
      title: 'GOVERNANCE & ADMIN',
      items: [
        { id: 'compliance', label: 'Compliance Frameworks', icon: ShieldCheck, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST'] },
        { id: 'reports', label: 'Reports & Disclosures', icon: FileSpreadsheet, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST'] },
        { id: 'audit-trail', label: 'Audit Trail', icon: History, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER'] },
        { id: 'organization', label: 'Organization', icon: Building2, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER'] },
        { id: 'backup', label: 'Backup & Recovery', icon: DatabaseBackup, roles: ['COMPANY_ADMIN'] },
        { id: 'settings', label: 'Settings', icon: Settings, roles: ['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] }
      ]
    }
  ];

  const roleLabels: Record<UserRole, string> = {
    COMPANY_ADMIN: 'Company Admin',
    SUSTAINABILITY_MANAGER: 'Sustainability Manager',
    ANALYST: 'Analyst',
    EMPLOYEE: 'Employee'
  };

  const getInitials = (name?: string) => {
    if (!name) return 'EX';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-[#0A0F1D] text-slate-300 md:flex select-none">
        {/* Brand Zone */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-sm">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">CarbonFlow</div>
              <div className="text-[10px] font-mono text-slate-400">ENTERPRISE PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Tenant Organization Context Card */}
        <div className="border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">ORGANIZATION</div>
          <div className="mt-0.5 truncate text-xs font-semibold text-white">
            {organization?.name || 'Acme Global Manufacturing'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono tabular-nums">Period: {organization?.reportingPeriod || '2025'}</span>
            <span className="text-emerald-400 font-medium">Reporting Active</span>
          </div>
        </div>

        {/* Structured Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navSections.map((sec) => {
            const filteredItems = sec.items.filter(item => !role || item.roles.includes(role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.title}>
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                  {sec.title}
                </div>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold border-l-2 border-emerald-500 rounded-l-none'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Public Website Switcher */}
        <div className="border-t border-slate-800/80 p-3 bg-slate-950/40">
          <button
            onClick={() => navigatePublic('/')}
            className="flex w-full items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
          >
            <span className="flex items-center gap-1.5">
              <span>Public Website</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 gap-4">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-slate-900 text-sm">CarbonFlow</span>
          </div>

          {/* Breadcrumbs (Top Bar Contract) */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="text-slate-600 font-medium">{organization?.name || 'CarbonFlow'}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold capitalize">
              {currentTab.replace('-', ' ')}
            </span>
          </div>

          {/* User Controls, Quick Role Switcher, Notifications, Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Role Switcher Evaluation Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                title="Switch role for evaluation"
              >
                <span className="text-slate-500 font-normal">Role:</span>
                <span>{role ? roleLabels[role] : 'Admin'}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="px-2.5 py-1.5 font-semibold text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-100">
                    Switch Evaluator Role
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {(['COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST', 'EMPLOYEE'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setRoleMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                          role === r ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">{roleLabels[r]}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            {r === 'COMPANY_ADMIN' && 'Full settings, tenant config, audit trail'}
                            {r === 'SUSTAINABILITY_MANAGER' && 'Audits, evidence, findings, disclosures'}
                            {r === 'ANALYST' && 'Data ledger entry & line verification'}
                            {r === 'EMPLOYEE' && 'Activity logging & assigned CAPA remedies'}
                          </div>
                        </div>
                        {role === r && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-84 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-semibold text-slate-900">
                      Notifications <span className="font-mono text-slate-400 font-normal">({unreadCount} unread)</span>
                    </span>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="mt-2.5 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-slate-400 text-xs">No pending notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-lg p-2.5 transition border ${
                            n.read 
                              ? 'bg-slate-50 border-slate-100 text-slate-600' 
                              : 'bg-emerald-50/50 border-emerald-100 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="font-semibold text-slate-900 text-xs">{n.title}</div>
                          <div className="mt-0.5 text-slate-600 text-[11px] leading-snug">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar with Initials */}
            <div className="hidden sm:flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs font-mono shadow-xs">
                {getInitials(user?.fullName)}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-semibold text-slate-900">{user?.fullName || 'Sustainability Executive'}</div>
                <div className="text-[10px] text-slate-500 font-medium">{user?.title || roleLabels[role || 'COMPANY_ADMIN']}</div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition focus:outline-none"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Modal */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative flex w-64 flex-col bg-[#0A0F1D] text-slate-300">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">CarbonFlow</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
              {navSections.map((sec) => (
                <div key={sec.title}>
                  <div className="px-2 mb-1 text-[10px] font-mono uppercase text-slate-400">{sec.title}</div>
                  <div className="space-y-0.5">
                    {sec.items
                      .filter(item => !role || item.roles.includes(role))
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setTab(item.id);
                              setMobileSidebarOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                              isActive ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-slate-800 p-3">
              <button
                onClick={() => {
                  navigatePublic('/');
                  setMobileSidebarOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300"
              >
                <span>Public Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
