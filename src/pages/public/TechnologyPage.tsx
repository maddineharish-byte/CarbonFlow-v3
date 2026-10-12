import React from 'react';
import {
  Server,
  Database,
  Code2,
  FileCode,
  Shield,
  Layers,
  Cpu,
  ArrowRight
} from 'lucide-react';

interface TechnologyPageProps {
  navigate: (path: string) => void;
}

export function TechnologyPage({ navigate }: TechnologyPageProps) {
  const stackLayers = [
    {
      layer: 'Frontend Presentation',
      tech: 'React 19 + TypeScript + Vite + Tailwind CSS',
      desc: 'Lightweight, modular Single Page Application. Pure client-side state handling with high data density tables, responsive sidebars, zero-pill discipline, and direct REST API integrations.'
    },
    {
      layer: 'Backend Application Server',
      tech: 'Java 21 + Spring Boot 3.3.4 + Spring Web',
      desc: 'High-throughput enterprise service layer. Modular package architecture dividing controllers, services, repositories, DTO records, and security filters.'
    },
    {
      layer: 'Data Access Layer',
      tech: 'Spring JDBC (NamedParameterJdbcTemplate)',
      desc: 'No Hibernate, JPA, or complex ORMs. We utilize explicit, readable, parameterized SQL queries with zero N+1 query penalties and deterministic transaction handling.'
    },
    {
      layer: 'Database & Schema Migrations',
      tech: 'Relational SQL Database + Flyway Migrations',
      desc: 'Versioned Flyway scripts (V1__initial_schema.sql, V2__seed_demo_data.sql). All schema changes are version-controlled, indexed, and auditable.'
    },
    {
      layer: 'Identity & Access Control',
      tech: 'Spring Security + BCrypt + HMAC-SHA256 JWT',
      desc: 'Stateless Bearer JWT tokens with tenant organization claims. ThreadLocal TenantContext injection and @PreAuthorize method-level security enforcement.'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Engineering Specification</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          Technology & Architecture
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Built on a rock-solid foundation of Java 21, Spring JDBC, and Relational SQL to ensure absolute calculation reliability and compliance auditability.
        </p>
      </div>

      <div className="space-y-4">
        {stackLayers.map((s, idx) => (
          <div key={s.layer} className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-300 transition">
            <div className="space-y-1 md:max-w-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Layer {idx + 1}: {s.layer}</span>
              <h3 className="text-lg font-bold text-stone-900">{s.tech}</h3>
            </div>
            <div className="text-xs text-stone-600 leading-relaxed md:max-w-xl">
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Engineering Rule Comparison */}
      <div className="rounded-2xl border border-stone-200 bg-white p-8">
        <h2 className="text-2xl font-bold text-stone-900">Why CarbonFlow Chose Spring JDBC Over JPA / Hibernate</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-red-200 bg-red-50/30 p-5">
            <h4 className="font-bold text-red-900 text-sm">Disadvantages of JPA/Hibernate in Carbon Audits</h4>
            <ul className="mt-3 space-y-2 text-xs text-stone-700">
              <li>• Hidden cascading updates can mutate historical carbon records unpredictably.</li>
              <li>• Lazy-loading runtime exceptions and N+1 queries degrade performance.</li>
              <li>• Generated SQL queries are opaque and difficult to verify during regulatory assurance inspections.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
            <h4 className="font-bold text-emerald-900 text-sm">Advantages of Explicit Spring JDBC</h4>
            <ul className="mt-3 space-y-2 text-xs text-stone-700">
              <li>• Every query is explicit, parameterized, and auditable by external security controllers.</li>
              <li>• Direct database aggregations calculate emissions sums without bringing thousands of rows into memory.</li>
              <li>• Append-only audit logs are maintained with pure SQL INSERT statements.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
