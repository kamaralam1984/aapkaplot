"use client";

/**
 * Smart inquiry form — captures name, phone, budget, location and posts
 * to /api/lead/inquiry. Designed for the lead-capture section near the
 * bottom of the homepage.
 */

import { useState } from "react";

const BUDGETS = [
  { value: "0-2000000",      label: "Up to ₹20 L" },
  { value: "2000000-5000000", label: "₹20 L – ₹50 L" },
  { value: "5000000-10000000", label: "₹50 L – ₹1 Cr" },
  { value: "10000000-30000000", label: "₹1 Cr – ₹3 Cr" },
  { value: "30000000-0", label: "₹3 Cr+" },
];

export function LeadCaptureSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/lead/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, budget, location, source: "homepage" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Could not submit — please try WhatsApp instead."); return; }
      setDone(true);
    } finally { setBusy(false); }
  }

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white p-6 sm:p-10 shadow-lift">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">Get the best property deals</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-display font-semibold">
                Tell us your brief — we&apos;ll do the shortlisting
              </h2>
              <p className="mt-3 text-emerald-50 leading-relaxed">
                Drop a quick note and the AapKaPlot team will hand-pick 3–5 verified options matching your budget and location. Usually within 30 minutes.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-emerald-50">
                <li>✓ No spam — one curated WhatsApp message, that&apos;s it.</li>
                <li>✓ Verified sellers only.</li>
                <li>✓ Free, no obligation.</li>
              </ul>
            </div>

            {done ? (
              <div className="rounded-2xl bg-white p-8 text-center text-ink-900">
                <p className="text-3xl">🎉</p>
                <h3 className="mt-3 text-2xl font-semibold">Got it, thanks!</h3>
                <p className="mt-2 text-ink-600 text-sm leading-relaxed">
                  We&apos;ll WhatsApp you a shortlist on <strong>+91 {phone}</strong> shortly. Want a faster reply?
                </p>
                <a
                  href={`https://wa.me/917039125391?text=${encodeURIComponent(`Hi AapKaPlot, I just filled the homepage form — Name: ${name}, Budget: ${budget}, Location: ${location}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                >
                  Continue on WhatsApp →
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-2xl bg-white p-5 sm:p-6 ring-1 ring-white/30 text-ink-900">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Your name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
                    placeholder="e.g. Animesh Kumar"
                    className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm" />
                </label>
                <label className="block mt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Mobile number</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel"
                    placeholder="10-digit phone"
                    className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm" />
                </label>
                <label className="block mt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Budget range</span>
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} required
                    className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm">
                    <option value="">Choose a range…</option>
                    {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </label>
                <label className="block mt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Interested location</span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} required
                    placeholder="e.g. Boring Road, Patna"
                    className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm" />
                </label>
                {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
                <button disabled={busy}
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-glow hover:brightness-105 disabled:opacity-60">
                  {busy ? "Sending…" : "Get Best Property Deals"}
                </button>
                <p className="mt-2 text-[11px] text-ink-500 text-center">
                  By submitting you agree to be contacted by AapKaPlot via WhatsApp/call.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
