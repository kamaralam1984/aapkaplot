import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Cpu, ShieldCheck, MapPin, Layers, Zap, GitBranch, Search } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AI & Technology — how AapKaPlot ranks, verifies and matches",
  description: "The proximity-weighted ranker, fraud heuristics, edge-rendered architecture and AI-generated copy behind AapKaPlot.",
  alternates: { canonical: "/ai-technology" },
};

const SYSTEMS = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI Recommendation Engine",
    body: "A proximity-weighted ranker scores every listing on distance, trust, freshness, price-edge, kind match and budget fit. Every search you see is personalized, not promoted.",
    chips: ["proximity 45%", "trust 20%", "freshness 10%", "price-edge 10%", "kind 15%"],
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "AI Fraud Detection",
    body: "Every listing runs through duplicate-image hashing, title-locality dedupe, price z-score anomaly and suspicious-keyword heuristics. High-risk listings are flagged for human review automatically.",
    chips: ["duplicate-image", "z-score price", "spam regex", "low-trust check"],
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    title: "Hyperlocal Search",
    body: "Haversine distance + radius slider from 500m to 20,000km. PostGIS-ready for production with GIST indexes — every property tagged with school/metro/hospital/market POIs.",
    chips: ["Haversine", "PostGIS", "500m – 20,000km", "POI tags"],
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "AI-generated descriptions",
    body: "Listings on /sell/new auto-draft via Claude (Anthropic) — 80-word factual copy in Indian English. Falls back to 8 deterministic templates when offline.",
    chips: ["Claude Sonnet", "8 templates fallback", "Indian English tuned"],
  },
];

const STACK = [
  { layer: "Frontend",      tools: ["Next.js 15 App Router", "React 19", "Tailwind CSS", "Framer Motion"] },
  { layer: "Edge runtime",  tools: ["Cloudflare Pages", "Cloudflare Workers", "Cloudflare R2"] },
  { layer: "Database",      tools: ["PostgreSQL + PostGIS", "Redis (geo + sessions)"] },
  { layer: "AI",            tools: ["Anthropic Claude", "Cloudflare Workers AI", "Heuristic engines"] },
  { layer: "Auth + safety", tools: ["OTP (Twilio)", "Cloudflare Turnstile", "Aadhaar via DigiLocker"] },
  { layer: "Realtime",      tools: ["socket.io", "Cloudflare Tunnel", "WhatsApp Business API"] },
];

export default function AiTechnologyPage() {
  return (
    <MarketingShell
      eyebrow="AI & Technology"
      title="The intelligence behind every recommendation"
      subtitle="Inside AapKaPlot's ranking engine, fraud detection, hyperlocal search and edge-rendered architecture — built for India's property market."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "AI & Technology" }]}
      actions={
        <Link href="/contact"><Button variant="primary" size="md">Talk to engineering</Button></Link>
      }
    >
      <ul className="grid gap-4 lg:grid-cols-2">
        {SYSTEMS.map((s) => (
          <li key={s.title} className="surface-card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">{s.icon}</span>
            <h3 className="mt-3 text-[16px] font-bold text-ink-900">{s.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{s.body}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.chips.map((c) => (
                <span key={c} className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-700">{c}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Architecture diagram */}
      <section className="mt-14 surface-card overflow-hidden p-6 lg:p-8">
        <h2 className="text-display-md font-display text-ink-900">Architecture at a glance</h2>
        <p className="mt-1 max-w-2xl text-[14.5px] text-ink-600">
          Edge-rendered, mostly serverless, with a single VPS origin behind a Cloudflare Tunnel for socket.io and long-running jobs.
        </p>

        <pre className="mt-6 overflow-x-auto rounded-2xl bg-ink-900 p-5 text-[12px] leading-relaxed text-emerald-300">
{`Browser  →  Cloudflare Edge  (300+ POPs, free SSL, DDoS)
              ↓
        Cloudflare Tunnel  (no open ports on origin)
              ↓
       Hostinger VPS  (Mumbai, Ubuntu 22.04, Node 20, PM2)
              ↓
   ┌────────────┴────────────┐
   ↓                         ↓
:3000 vidyt.com         :3001 8rupiya.in (AapKaPlot)
                              ↓
                       Next.js 15 App Router
                              ↓
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
          Postgres        Cloudflare R2      Claude API
        (PostGIS)         (media)         (descriptions)`}
        </pre>
      </section>

      {/* Stack list */}
      <section className="mt-14">
        <h2 className="text-display-md font-display text-ink-900">The full stack</h2>
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {STACK.map((s) => (
            <li key={s.layer} className="surface-card p-5">
              <p className="inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
                <Layers className="h-3 w-3" />
                {s.layer}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {s.tools.map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700">
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 grid gap-4 lg:grid-cols-3">
        {[
          { icon: <Zap className="h-5 w-5" />,       title: "30 ms TTFB",      body: "Edge-rendered pages at Cloudflare POPs across India." },
          { icon: <Search className="h-5 w-5" />,    title: "Fuzzy search",    body: "1-char typo tolerance + prefix scoring across 120-listing catalogue." },
          { icon: <GitBranch className="h-5 w-5" />, title: "30 s deploys",    body: "GitHub Actions → SSH → PM2 reload, zero downtime." },
        ].map((c) => (
          <div key={c.title} className="surface-card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{c.icon}</span>
            <h3 className="mt-3 text-[15px] font-bold text-ink-900">{c.title}</h3>
            <p className="mt-1 text-[13.5px] text-ink-600">{c.body}</p>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
