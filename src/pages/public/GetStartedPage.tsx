import React, { useState } from 'react';
import { Leaf, ArrowRight, AlertCircle, Building2, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GetStartedProps {
  navigate: (path: string) => void;
  onSuccess: () => void;
}

export function GetStartedPage({ navigate, onSuccess }: GetStartedProps) {
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({
    organizationName: '',
    industry: 'Technology & Enterprise Software',
    country: 'United States',
    fullName: '',
    title: 'Director of ESG & Sustainability',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Google registration failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
            CF
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Register Your Organization</h1>
          <p className="text-xs text-slate-600">
            Set up an isolated enterprise workspace for carbon accounting, evidence tracking, and audit workflows.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Google Onboarding with Firebase */}
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
            <span>{googleLoading ? 'Connecting to Google...' : 'Instant Setup with Google (Firebase)'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-stone-500 font-medium">
              <span className="bg-white px-2">or register manually</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">Organization / Corporate Legal Name</label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={form.organizationName}
                  onChange={e => setForm({ ...form, organizationName: e.target.value })}
                  placeholder="Acme Global Industries"
                  className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Industry Sector</label>
              <select
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                <option value="Technology & Enterprise Software">Technology & Enterprise Software</option>
                <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                <option value="Transportation & Logistics">Transportation & Logistics</option>
                <option value="Energy & Utilities">Energy & Utilities</option>
                <option value="Consumer Goods & Retail">Consumer Goods & Retail</option>
                <option value="Financial & Professional Services">Financial & Professional Services</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Jurisdiction / Country</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                placeholder="United States"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Lead Administrator Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Sarah Chen"
                  className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Official Job Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Head of Sustainability"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Corporate Work Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="s.chen@acmeglobal.com"
                  className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Master Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-800 py-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Provisioning Workspace...' : 'Create Organization Workspace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-stone-100 pt-4 text-center text-xs text-stone-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/sign-in')}
            className="font-semibold text-emerald-800 hover:underline"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
}
