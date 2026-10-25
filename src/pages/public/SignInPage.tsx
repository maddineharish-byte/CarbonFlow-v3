import React, { useState } from 'react';
import { Leaf, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SignInPageProps {
  navigate: (path: string) => void;
  onSuccess: () => void;
}

export function SignInPage({ navigate, onSuccess }: SignInPageProps) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('admin@carbonflow.io');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('expired') === 'true' || window.history.state?.sessionExpired === true;
    }
    return false;
  });

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const demoAccounts: Array<{
    role: UserRole;
    label: string;
    email: string;
    desc: string;
    badge: string;
  }> = [
    {
      role: 'COMPANY_ADMIN',
      label: 'Company Admin',
      email: 'admin@carbonflow.io',
      desc: 'Sarah Chen: Full governance, user invites, settings, all modules',
      badge: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      role: 'SUSTAINABILITY_MANAGER',
      label: 'Sustainability Manager',
      email: 'sustainability@carbonflow.io',
      desc: 'Marcus Vance: Lead auditor, evidence sign-off, findings, reports',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      role: 'ANALYST',
      label: 'Carbon Analyst',
      email: 'analyst@carbonflow.io',
      desc: 'Elena Rostova: Activity data entry, flight extracts, verification support',
      badge: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      role: 'EMPLOYEE',
      label: 'Facility Employee',
      email: 'employee@carbonflow.io',
      desc: 'David Kim: Chiller maintenance logs, assigned corrective actions',
      badge: 'bg-stone-100 text-stone-800 border-stone-200'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'Password123!');
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setResetModalOpen(false);
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Quick Evaluation One-Click Logins */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">Instant Evaluator Access</span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Sign In to CarbonFlow
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Select any of the 4 preloaded test personas below to evaluate role-based access control and live data instantly:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleSelectDemo(account.email)}
                disabled={loading}
                className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-emerald-500 hover:shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${account.badge}`}>
                    {account.label}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 hover:underline">Instant Launch →</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-900 font-mono">{account.email}</div>
                <div className="mt-1 text-[11px] text-slate-500 leading-snug">{account.desc}</div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Standard Test Credentials:</span> All evaluation demo accounts share the password <code className="bg-white border rounded px-1.5 py-0.5 text-slate-800 font-mono">Password123!</code>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Form */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm">
                CF
              </div>
              <span className="font-bold text-slate-900 text-lg">Secure Workspace Sign-In</span>
            </div>

            {sessionExpiredNotice && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Your session has expired or requires authentication. Please sign in to continue.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionExpiredNotice(false)}
                  className="text-amber-700 hover:text-amber-900 font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-in with Firebase Auth */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 hover:border-stone-400 transition disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google (Firebase)'}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-stone-500 font-medium">
                  <span className="bg-white px-2">or password login</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@carbonflow.io"
                    className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(true)}
                    className="text-[11px] text-emerald-800 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-800 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>
            </form>

            <div className="mt-6 border-t border-stone-100 pt-4 text-center text-xs text-stone-600">
              Need a new enterprise organization?{' '}
              <button
                onClick={() => navigate('/get-started')}
                className="font-semibold text-emerald-800 hover:underline"
              >
                Register here
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-xl text-stone-900">
            <h3 className="text-base font-bold">Reset Password</h3>
            <p className="mt-1 text-xs text-stone-600">
              Enter your corporate email address to receive password reset instructions.
            </p>

            {resetSuccess ? (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                <span>Reset instructions dispatched successfully.</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@organization.com"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
