import type { Metadata } from "next";
import Link from "next/link";
import { Users, Sparkles, MapPin, ShieldCheck, Building2, TrendingUp } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About AapKaPlot — India's AI-powered real estate platform",
  description:
    "AapKaPlot is rebuilding how India discovers, evaluates and buys property — AI recommendations, verified owners, live maps, and a buyer-first experience.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About AapKaPlot",
    description: "India's AI-powered real estate platform — verified, fast, buyer-first.",
    type: "article",
  },
};

const STATS = [
  { label: "Properties listed", value: "20,000+" },
  { label: "Cities live", value: "5" },
  { label: "Verified owners", value: "92%" },
  { label: "Avg. owner reply", value: "47 min" },
];

const PILLARS = [
  { icon: <Sparkles className="h-5 w-5" />, title: "AI-first discovery", body: "Every search is ranked by proximity, trust score, freshness and price competitiveness — not who paid the most." },
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Verified by default", body: "Owners pass OTP, document and Aadhaar checks before a listing goes live. No fake listings, no broker noise." },
  { icon: <MapPin className="h-5 w-5" />, title: "Hyperlocal radius search", body: "Find plots and flats within 500 m to 20,000 km — with live maps and satellite views, not generic locality filters." },
  { icon: <Users className="h-5 w-5" />, title: "Buyer + Seller equal", body: "One dashboard for buyers, one for sellers, full transparency on leads, visits and offers. No black-box workflows." },
];

const MILESTONES = [
  { year: "2024", title: "Founded", body: "Started in Kolkata with a single mission — make Indian property search trustworthy." },
  { year: "2025", title: "AI recommendations live", body: "Launched proximity-weighted, trust-scored ranking across 20,000+ listings." },
  { year: "2026", title: "5 cities, full stack", body: "Live in Kolkata, Bengaluru, Mumbai, Pune and Delhi NCR with R2 media, verified owners and lead workflows." },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AapKaPlot",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com"}/icon-512.png`,
    foundingDate: "2024-01-01",
    description: "India's AI-powered real estate platform.",
    sameAs: [],
  };

  return (
    <MarketingShell
      eyebrow="About us"
      title="Property search, finally built for buyers"
      subtitle="AapKaPlot is rebuilding how India discovers, evaluates and buys property — with AI recommendations, verified owners and a transparent lead workflow."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      actions={
        <Link href="/contact">
          <Button variant="primary" size="md">Talk to us</Button>
        </Link>
      }
      jsonLd={jsonLd}
    >
      {/* Stats row */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <li key={s.label} className="surface-card p-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">{s.label}</p>
            <p className="mt-1.5 text-display-md font-display text-ink-900">{s.value}</p>
          </li>
        ))}
      </ul>

      {/* Pillars */}
      <section className="mt-14">
        <h2 className="text-display-md font-display text-ink-900">What we stand for</h2>
        <p className="mt-1 max-w-2xl text-[14.5px] text-ink-600">
          Four principles that decide every product call we make.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="surface-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                {p.icon}
              </span>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{p.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-14">
        <h2 className="text-display-md font-display text-ink-900">Our story</h2>
        <ol className="mt-6 grid gap-4 lg:grid-cols-3">
          {MILESTONES.map((m, i) => (
            <li key={m.year} className="surface-card relative p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-bold text-brand-700">
                <Building2 className="h-3 w-3" />
                {m.year}
              </span>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{m.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{m.body}</p>
              {i < MILESTONES.length - 1 && (
                <span className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-ink-300 lg:inline" aria-hidden>→</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* CTA strip */}
      <section className="mt-14 rounded-3xl bg-brand-gradient p-8 text-white lg:p-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider backdrop-blur-md">
              <TrendingUp className="h-3 w-3" /> Now serving 5 cities
            </p>
            <h3 className="mt-3 text-display-md font-display">List your property in 3 minutes</h3>
            <p className="mt-2 max-w-xl text-[14.5px] text-white/85">
              Free to list. Verified owner badge. Real-time leads via WhatsApp + chat.
            </p>
          </div>
          <Link href="/sell/new">
            <Button variant="secondary" size="lg" className="!bg-white !text-ink-900 hover:!bg-ink-100">
              Post property free
            </Button>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
