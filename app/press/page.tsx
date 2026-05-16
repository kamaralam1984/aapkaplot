import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, Calendar, Mail } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Press & Media — AapKaPlot",
  description: "Press releases, media kit, brand assets and contact for AapKaPlot. Latest news on India's AI-powered real estate platform.",
  alternates: { canonical: "/press" },
};

const RELEASES = [
  { date: "2026-04-12", title: "AapKaPlot expands to Mumbai, Pune and Delhi NCR with verified-owner badge",      excerpt: "After 18 months in Kolkata, the AI-first real estate platform is live in 5 cities with 20,000+ listings…" },
  { date: "2026-02-03", title: "AapKaPlot launches AI fraud detection to flag duplicate listings + price anomalies", excerpt: "A heuristic + ML engine now scores every listing on duplicate-image, price z-score and trust signals…" },
  { date: "2025-11-20", title: "Series Seed announcement — building the buyer-first property stack",                excerpt: "AapKaPlot raised seed funding to scale its AI recommendations and verified-owner network across India…" },
];

const ASSETS = [
  { label: "Logo pack (SVG + PNG)",   href: "#" },
  { label: "Brand guidelines (PDF)",  href: "#" },
  { label: "Product screenshots ZIP", href: "#" },
  { label: "Founder bios + photos",   href: "#" },
];

export default function PressPage() {
  return (
    <MarketingShell
      eyebrow="Press & Media"
      title="The story of AapKaPlot, in one place"
      subtitle="Latest announcements, media coverage and brand assets. For interviews, demo videos or quotes — email press@aapkaplot.com."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Press" }]}
    >
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Releases */}
        <section>
          <h2 className="text-display-md font-display text-ink-900">Press releases</h2>
          <ul className="mt-6 space-y-3">
            {RELEASES.map((r) => (
              <li key={r.title} className="surface-card group p-5 transition hover:border-brand-500/40">
                <p className="inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <h3 className="mt-2 text-[16px] font-bold text-ink-900 group-hover:text-brand-700">{r.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{r.excerpt}</p>
                <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-600 hover:underline">
                  Request full press release <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Sidebar — assets + contact */}
        <aside className="space-y-6">
          <section className="surface-card p-5">
            <h3 className="text-[14px] font-bold text-ink-900">Brand assets</h3>
            <p className="mt-1 text-[12.5px] text-ink-500">Logos, colour palette, fonts, screenshots.</p>
            <ul className="mt-4 space-y-2">
              {ASSETS.map((a) => (
                <li key={a.label}>
                  <a href={a.href} className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-600 hover:underline">
                    <Download className="h-3.5 w-3.5" />
                    {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-5">
            <h3 className="inline-flex items-center gap-2 text-[14px] font-bold text-ink-900">
              <Mail className="h-4 w-4 text-brand-500" />
              Press contact
            </h3>
            <p className="mt-2 text-[13.5px] text-ink-700">For interviews, expert quotes, demo videos or product walkthroughs.</p>
            <a href="mailto:press@aapkaplot.com" className="mt-2 inline-block text-[13.5px] font-bold text-brand-600 hover:underline">
              press@aapkaplot.com
            </a>
          </section>
        </aside>
      </div>
    </MarketingShell>
  );
}
