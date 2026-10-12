import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Get in Touch</span>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl">
          Contact the CarbonFlow Enterprise Team
        </h1>
        <p className="mt-4 text-base text-stone-600">
          Reach our carbon accounting solutions team for enterprise deployment discussions, compliance mapping consultations, or technical architecture reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-stone-900">Direct Contacts</h3>
            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-800" />
                <span>enterprise@carbonflow.io</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-800" />
                <span>+1 (415) 555-0199</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-800" />
                <span>San Francisco, California & Global Operations</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-xs text-stone-600">
            <h4 className="font-bold text-stone-900 text-sm">Security & Deployment Briefings</h4>
            <p className="mt-1 leading-relaxed">
              Our engineering team can provide deep-dive sessions on our Java 21 Spring Boot architecture, Spring JDBC query structures, and Cloud SQL multi-tenant security safeguards.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-700 mx-auto" />
              <h3 className="text-lg font-bold text-stone-900">Inquiry Received</h3>
              <p className="text-xs text-stone-600">
                Thank you. An ESG solutions engineer from our technical team will contact {form.email} within 24 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900">Send an Inquiry</h3>
              <div>
                <label className="block text-xs font-semibold text-stone-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="s.jenkins@enterprise.com"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Organization Name</label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Global Logistics"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Inquiry Notes</label>
                <textarea
                  rows={3}
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Please describe your current GHG audit or CSRD assurance requirements..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-800 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 transition"
              >
                Submit Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
