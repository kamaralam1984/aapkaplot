"use client";

import { useState } from "react";

type Tab = "email" | "grahak" | "marketing";

export function AiToolsPanel() {
  const [tab, setTab] = useState<Tab>("email");
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-200/70 overflow-hidden">
      <nav className="flex divide-x divide-ink-200/70 border-b border-ink-200/70">
        <TabBtn label="✉ Email draft" active={tab === "email"} onClick={() => setTab("email")} />
        <TabBtn label="🎯 Grahak match" active={tab === "grahak"} onClick={() => setTab("grahak")} />
        <TabBtn label="📣 Marketing copy" active={tab === "marketing"} onClick={() => setTab("marketing")} />
      </nav>
      <div className="p-5">
        {tab === "email" && <EmailDraftPanel />}
        {tab === "grahak" && <GrahakMatchPanel />}
        {tab === "marketing" && <MarketingCopyPanel />}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-semibold transition ${active ? "bg-emerald-50 text-emerald-700" : "text-ink-600 hover:bg-ink-50/60"}`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Email draft
// ─────────────────────────────────────────────────────────────

function EmailDraftPanel() {
  const [purpose, setPurpose] = useState<"welcome" | "lead-followup" | "site-visit" | "price-drop" | "marketing">("lead-followup");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [budget, setBudget] = useState("");
  const [propTitle, setPropTitle] = useState("");
  const [tone, setTone] = useState<"warm" | "formal" | "playful">("warm");
  const [lang, setLang] = useState<"en" | "hi" | "hinglish">("hinglish");

  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          to: { name, city, locality, budget },
          context: { propertyTitle: propTitle },
          tone, lang,
        }),
      });
      const j = await res.json();
      setSubject(j.subject ?? "");
      setBody(j.body ?? "");
      setSource(j.source ?? null);
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        <Field label="Purpose">
          <select value={purpose} onChange={(e) => setPurpose(e.target.value as typeof purpose)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
            <option value="welcome">Welcome new inquiry</option>
            <option value="lead-followup">Follow-up (no reply)</option>
            <option value="site-visit">Site visit confirmation</option>
            <option value="price-drop">Price drop alert</option>
            <option value="marketing">Monthly marketing email</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recipient name"><Input value={name} onChange={setName} placeholder="Animesh" /></Field>
          <Field label="Budget"><Input value={budget} onChange={setBudget} placeholder="₹50 L" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input value={city} onChange={setCity} placeholder="Patna" /></Field>
          <Field label="Locality"><Input value={locality} onChange={setLocality} placeholder="Boring Road" /></Field>
        </div>
        <Field label="Property title (optional)"><Input value={propTitle} onChange={setPropTitle} placeholder="3 BHK on Boring Road" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tone">
            <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="warm">Warm</option><option value="formal">Formal</option><option value="playful">Playful</option>
            </select>
          </Field>
          <Field label="Language">
            <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="hinglish">Hinglish</option><option value="en">English</option><option value="hi">Hindi</option>
            </select>
          </Field>
        </div>
        <button onClick={go} disabled={busy} className="w-full mt-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105 disabled:opacity-60">
          {busy ? "Drafting…" : "Generate email"}
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Subject">
          <Input value={subject} onChange={setSubject} placeholder="Generated subject will appear here" />
        </Field>
        <Field label="Body">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed"
            placeholder="Generated email body will appear here…" />
        </Field>
        {source && <p className="text-xs text-ink-500">Source: <span className={source === "openai" ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>{source}</span></p>}
        {body && (
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(`${subject}\n\n${body}`)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs hover:bg-ink-50">Copy</button>
            <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Open in mail app</a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Grahak match
// ─────────────────────────────────────────────────────────────

function GrahakMatchPanel() {
  const [leadId, setLeadId] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [budget, setBudget] = useState("");
  const [kind, setKind] = useState("");
  const [intent, setIntent] = useState("");
  const [shortlist, setShortlist] = useState(5);

  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<{ id: string; score: number; reason: string }[]>([]);
  const [source, setSource] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { shortlist };
      if (leadId) body.leadId = leadId;
      else {
        const crit: Record<string, unknown> = {};
        if (city) crit.city = city;
        if (locality) crit.locality = locality;
        if (kind) crit.kind = kind;
        if (intent) crit.intent = intent;
        if (budget) crit.budgetMaxInr = Number(budget) * (budget.toLowerCase().includes("cr") ? 1_00_00_000 : 1_00_000);
        body.criteria = crit;
      }
      const res = await fetch("/api/ai/grahak-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setMatches(j.matches ?? []);
      setSource(j.source ?? null);
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-3">
        <Field label="Inquiry ID (optional — overrides criteria below)">
          <Input value={leadId} onChange={setLeadId} placeholder="cuid… (from Inquiry table)" />
        </Field>
        <div className="text-xs text-ink-500 -mt-2">— or fill the manual criteria —</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input value={city} onChange={setCity} placeholder="Patna" /></Field>
          <Field label="Locality"><Input value={locality} onChange={setLocality} placeholder="Boring Road" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget (lakh or 'cr')"><Input value={budget} onChange={setBudget} placeholder="50 or 1.5cr" /></Field>
          <Field label="Shortlist size">
            <Input value={String(shortlist)} onChange={(v) => setShortlist(Math.max(1, Math.min(10, Number(v) || 5)))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kind">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="">Any</option>{["PLOT","FLAT","HOUSE","VILLA","SHOP","OFFICE","WAREHOUSE","AGRICULTURE"].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Intent">
            <select value={intent} onChange={(e) => setIntent(e.target.value)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="">Any</option><option value="BUY">BUY</option><option value="RENT">RENT</option><option value="SELL">SELL</option>
            </select>
          </Field>
        </div>
        <button onClick={go} disabled={busy} className="w-full mt-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105 disabled:opacity-60">
          {busy ? "Matching…" : "Find best matches"}
        </button>
      </div>

      <div>
        {matches.length === 0 ? (
          <p className="text-sm text-ink-500 italic">Results will appear here.</p>
        ) : (
          <>
            <p className="text-xs text-ink-500 mb-3">Source: <span className={source === "openai" ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>{source ?? "—"}</span></p>
            <ol className="space-y-2">
              {matches.map((m, i) => (
                <li key={m.id} className="rounded-lg ring-1 ring-ink-200/70 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-ink-500">#{i + 1} · {m.id.slice(0, 10)}…</span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Score {m.score}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{m.reason}</p>
                  <a href={`/property/${m.id}`} target="_blank" className="mt-1 inline-block text-xs text-emerald-700 hover:underline">Open listing →</a>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Marketing copy
// ─────────────────────────────────────────────────────────────

function MarketingCopyPanel() {
  const [channel, setChannel] = useState<"whatsapp" | "instagram" | "facebook" | "google-ad" | "email-subject" | "sms">("whatsapp");
  const [topic, setTopic] = useState("Fresh plots in Boring Road this week");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [budget, setBudget] = useState("");
  const [variants, setVariants] = useState(3);
  const [tone, setTone] = useState<"urgent" | "warm" | "luxe" | "informative">("warm");
  const [lang, setLang] = useState<"en" | "hi" | "hinglish">("hinglish");

  const [busy, setBusy] = useState(false);
  const [copies, setCopies] = useState<string[]>([]);
  const [source, setSource] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/marketing-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel, topic, variants, tone, lang,
          audience: { city, locality, budget },
        }),
      });
      const j = await res.json();
      setCopies(j.copies ?? []);
      setSource(j.source ?? null);
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-3">
        <Field label="Channel">
          <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
            <option value="whatsapp">WhatsApp broadcast</option>
            <option value="instagram">Instagram caption</option>
            <option value="facebook">Facebook post</option>
            <option value="google-ad">Google search ad</option>
            <option value="email-subject">Email subject line</option>
            <option value="sms">SMS</option>
          </select>
        </Field>
        <Field label="Topic">
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input value={city} onChange={setCity} placeholder="Patna" /></Field>
          <Field label="Locality"><Input value={locality} onChange={setLocality} placeholder="Boring Road" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget"><Input value={budget} onChange={setBudget} placeholder="₹20-50 L" /></Field>
          <Field label="Variants">
            <Input value={String(variants)} onChange={(v) => setVariants(Math.max(1, Math.min(5, Number(v) || 3)))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tone">
            <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="warm">Warm</option><option value="urgent">Urgent</option><option value="luxe">Luxe</option><option value="informative">Informative</option>
            </select>
          </Field>
          <Field label="Language">
            <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="hinglish">Hinglish</option><option value="en">English</option><option value="hi">Hindi</option>
            </select>
          </Field>
        </div>
        <button onClick={go} disabled={busy} className="w-full mt-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105 disabled:opacity-60">
          {busy ? "Writing…" : "Generate copy"}
        </button>
      </div>

      <div>
        {copies.length === 0 ? (
          <p className="text-sm text-ink-500 italic">Copy variants will appear here.</p>
        ) : (
          <>
            <p className="text-xs text-ink-500 mb-3">Source: <span className={source === "openai" ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>{source ?? "—"}</span></p>
            <ul className="space-y-2">
              {copies.map((c, i) => (
                <li key={i} className="rounded-lg ring-1 ring-ink-200/70 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-ink-500">Variant {i + 1}</span>
                    <button onClick={() => navigator.clipboard.writeText(c)} className="text-xs text-emerald-700 hover:underline">Copy</button>
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap text-sm text-ink-800 font-sans">{c}</pre>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared form bits
// ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-ink-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
    />
  );
}
