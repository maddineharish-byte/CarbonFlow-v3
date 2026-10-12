import React from 'react';
import { Leaf, Shield, CheckCircle2, Lock, Database } from 'lucide-react';

interface PublicFooterProps {
  navigate: (path: string) => void;
}

export function PublicFooter({ navigate }: PublicFooterProps) {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Leaf className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Carbon<span className="text-emerald-400">Flow</span></span>
            </div>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm">
              Enterprise carbon audit intelligence, evidence traceability, and automated GHG emissions compliance verification. From source activity to external assurance.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                ISO 14064-1 & 14064-3 Ready
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                Spring JDBC & SQL
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                Tenant-Isolated SQL
              </span>
            </div>
          </div>

          {/* Platform Columns */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button onClick={() => navigate('/product')} className="hover:text-white transition-colors">Product Overview</button></li>
              <li><button onClick={() => navigate('/features')} className="hover:text-white transition-colors">Core Features</button></li>
              <li><button onClick={() => navigate('/how-it-works')} className="hover:text-white transition-colors">Audit Workflow</button></li>
              <li><button onClick={() => navigate('/compliance')} className="hover:text-white transition-colors">Compliance Frameworks</button></li>
              <li><button onClick={() => navigate('/technology')} className="hover:text-white transition-colors">Architecture & Stack</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Trust & Security</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button onClick={() => navigate('/security')} className="hover:text-white transition-colors">Security Architecture</button></li>
              <li><button onClick={() => navigate('/documentation')} className="hover:text-white transition-colors">Developer Docs</button></li>
              <li><button onClick={() => navigate('/compliance')} className="hover:text-white transition-colors">GHG Protocol (Scope 1-3)</button></li>
              <li><button onClick={() => navigate('/compliance')} className="hover:text-white transition-colors">ISO 14064 & CSRD</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About CarbonFlow</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">Contact Enterprise Team</button></li>
              <li><button onClick={() => navigate('/sign-in')} className="hover:text-white transition-colors">Sign In</button></li>
              <li><button onClick={() => navigate('/get-started')} className="hover:text-white transition-colors">Create Account</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800/80 pt-8 sm:flex-row text-xs text-slate-500 gap-4">
          <p>© 2026 CarbonFlow Systems Inc. Enterprise Sustainability Intelligence.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SOC 2 Type II Certified</span>
            <span aria-hidden="true">·</span>
            <span>GDPR Compliant</span>
            <span aria-hidden="true">·</span>
            <span>ISO 27001 Controls</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
