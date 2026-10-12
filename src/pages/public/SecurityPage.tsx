import React from 'react';
import {
  Shield,
  Lock,
  Users,
  Database,
  History,
  KeyRound,
  FileCheck2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface SecurityPageProps {
  navigate: (path: string) => void;
}

export function SecurityPage({ navigate }: SecurityPageProps) {
  const capabilities = [
    {
      title: 'Secure Authentication & Password Hashing',
      icon: KeyRound,
      desc: 'Industry-standard BCrypt adaptive salted hashing with cost factor 10. Passwords are never stored in plaintext or logged. Stateless JWT sessions with configurable HMAC-SHA256 signatures and strict expiration intervals.'
    },
    {
      title: 'Backend Authorization & Least Privilege',
      icon: Lock,
      desc: 'Authorization is authoritatively enforced on every Java Spring Boot endpoint using @PreAuthorize role checks. We never rely solely on frontend UI hiding.'
    },
    {
      title: 'Multi-Tenant Data Isolation',
      icon: Users,
      desc: 'Every organization owns isolated data records. Java filters inspect authenticated tenant context on every request; repository SQL queries bind organization_id parameters explicitly to prevent cross-tenant exposure.'
    },
    {
      title: 'Database Access Controls & SQL Injection Defense',
      icon: Database,
      desc: 'Implemented using Spring JDBC NamedParameterJdbcTemplate with parameterized SQL. No string concatenation of user inputs into SQL queries. Automated schema versioning via Flyway.'
    },
    {
      title: 'Append-Only Audit Trail',
      icon: History,
      desc: 'Every authentication event, data creation, modification, evidence verification, and role change is logged to an append-only audit_logs database table with actor ID, IP address, and metadata payload.'
    },
    {
      title: 'Secure Evidence Storage Boundaries',
      icon: FileCheck2,
      desc: 'Evidence files are bound to tenant IDs and access-controlled through signed authorized endpoints. Private utility bills and contractual receipts cannot be accessed anonymously.'
    },
    {
      title: 'Secret Management & Zero Hardcoded Keys',
      icon: Shield,
      desc: 'Database credentials, JWT signature keys, and API secrets are injected strictly via environment variables. No secrets are committed into version control.'
    },
    {
      title: 'Resilient Backup & Disaster Recovery',
      icon: FileText,
      desc: 'Structured Flyway migration history provides deterministic database bootstrapping. Logical organization-level data export allows zero-lock compliance backups.'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Cybersecurity Architecture</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          Security & Tenant Isolation
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Our security posture is grounded in explicit engineering controls, backend authorization, and cryptographic integrity.
        </p>
      </div>

      {/* Honest Compliance & Certification Disclosure Banner */}
      <div className="rounded-xl border border-stone-300 bg-stone-100/90 p-5 text-xs text-stone-700 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Transparent Architecture Disclosure
        </div>
        <p className="mt-2 text-stone-600 leading-relaxed">
          CarbonFlow does not make unverified claims such as "ISO certified", "SOC 2 Type II certified", or "GDPR certified" without external third-party audit reports. Instead, we document our concrete technical implementations: BCrypt password hashing, Spring Security role checks, ThreadLocal tenant isolation, and parameterized SQL queries.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {capabilities.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs hover:border-emerald-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-stone-900">{c.title}</h3>
              <p className="mt-2 text-xs text-stone-600 leading-relaxed">{c.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-8 text-white text-center max-w-2xl mx-auto">
        <h3 className="text-xl font-bold">Review Our Security Implementation Directly</h3>
        <p className="mt-2 text-xs text-stone-400">
          Inspect our Spring Security configuration, JWT authorization filter, and Flyway migration SQL scripts in the documentation.
        </p>
        <button
          onClick={() => navigate('/technology')}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition"
        >
          <span>Explore Technology Stack</span>
        </button>
      </div>
    </div>
  );
}
