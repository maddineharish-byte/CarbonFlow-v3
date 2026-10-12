import React, { useState } from 'react';
import { Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface PublicNavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export function PublicNavbar({ currentPath, navigate }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Platform', path: '/product' },
    { label: 'Capabilities', path: '/features' },
    { label: 'Audit Engine', path: '/how-it-works' },
    { label: 'Compliance', path: '/compliance' },
    { label: 'Security & Trust', path: '/security' },
    { label: 'Architecture', path: '/technology' },
    { label: 'Docs', path: '/documentation' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark (Top Bar Contract) */}
        <div 
          onClick={() => navigate('/')} 
          className="flex cursor-pointer items-center gap-2.5 whitespace-nowrap shrink-0 select-none group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm transition group-hover:bg-emerald-700">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Carbon<span className="text-emerald-600">Flow</span>
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentPath === link.path
                  ? 'text-emerald-700 font-semibold'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/sign-in')}
            className="whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/get-started')}
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.98]"
          >
            <span>Launch Platform</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  currentPath === link.path ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  navigate('/sign-in');
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-lg border border-slate-300 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  navigate('/get-started');
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Launch Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

