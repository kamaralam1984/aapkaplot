import type { Metadata } from "next";
import Link from "next/link";
import { Search, MessagesSquare, Home, Building2, ShieldCheck, IndianRupee, BookOpen, ChevronRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Help Center — AapKaPlot",
  description: "Find answers to common questions about buying, renting, selling and verification on AapKaPlot. WhatsApp support in 30 min.",
  alternates: { canonical: "/help" },
};

const CATEGORIES = [
  { icon: <Home className="h-5 w-5" />,       title: "For buyers",    count: 12, href: "#buyers" },
  { icon: <Building2 className="h-5 w-5" />,  title: "For sellers",   count: 9,  href: "#sellers" },
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Verification", count: 6,  href: "#verification" },
  { icon: <IndianRupee className="h-5 w-5" />,title: "Payments & boosts", count: 8, href: "#payments" },
];

const FAQ = [
  {
    section: "For buyers",
    id: "buyers",
    items: [
      { q: "Is AapKaPlot free for buyers?", a: "Yes — searching, saving, contacting verified owners and scheduling visits is 100% free. We never charge buyers commission." },
      { q: "How do I know a listing is genuine?", a: "Look for the green Verified badge. Owners pass OTP, document and Aadhaar checks before their listing goes live. Every listing also has an AI Trust Score from 0–100." },
      { q: "Can I see the owner's phone number?", a: "Yes — sign in and click 'Show Phone Number' on any property detail page. You get 8 reveals per day to prevent spam." },
      { q: "How is distance calculated?", a: "We use the Haversine formula in dev and PostGIS ST_DistanceSphere in production — accurate to within metres anywhere in India." },
    ],
  },
  {
    section: "For sellers",
    id: "sellers",
    items: [
      { q: "Is posting a property free?", a: "Yes — up to 2 active listings on the Free plan. Unlimited listings, top-of-search placement and homepage Recommendations are on Premium." },
      { q: "How long does verification take?", a: "Documents + Aadhaar are typically reviewed within 24 hours. You can post immediately — the verified badge appears once review is complete." },
      { q: "How do leads reach me?", a: "Buyers contact you via WhatsApp, chat or phone reveal. Every lead also appears in your seller dashboard with full history." },
      { q: "Can I boost a single listing?", a: "Yes — Spotlight (7 days, ₹499), Featured (30 days, ₹1,499) or Turbo (₹2,999). One-time payment, instant activation." },
    ],
  },
  {
    section: "Verification & fraud",
    id: "verification",
    items: [
      { q: "What documents do I need to verify as a seller?", a: "Aadhaar (front + back, masked), PAN card, and one ownership document — sale deed, RERA registration, or owner NoC." },
      { q: "Are my documents safe?", a: "Yes — they're encrypted at rest and shared only with AapKaPlot's verification team. Never shared with buyers, sellers or third parties." },
      { q: "How does AapKaPlot catch fake listings?", a: "Every listing runs through AI fraud detection — duplicate-image hashing, price z-score anomaly, suspicious keywords and trust score. Flagged listings go through human review." },
    ],
  },
  {
    section: "Payments & boosts",
    id: "payments",
    items: [
      { q: "What payment methods do you accept?", a: "UPI, all major credit/debit cards (Visa, Mastercard, RuPay), NetBanking and Razorpay wallet. GST invoice included." },
      { q: "Can I cancel a Premium plan?", a: "Yes — cancellation takes effect at the next billing cycle. We refund 100% within 24 hours of any purchase if you change your mind." },
      { q: "Will my boost auto-renew?", a: "No. Spotlight, Featured and Turbo are one-time purchases. Premium is a monthly subscription you can cancel anytime." },
    ],
  },
];

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((s) =>
      s.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      }))
    ),
  };

  return (
    <MarketingShell
      eyebrow="Help Center"
      title="How can we help?"
      subtitle="Quick answers to common questions. Still stuck? WhatsApp us at +91 7039125391 — usually replied within 30 minutes."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Help" }]}
      jsonLd={jsonLd}
    >
      {/* Search bar (static for now) */}
      <div className="mx-auto max-w-2xl">
        <label className="relative flex h-14 items-center rounded-2xl border border-ink-200 bg-white px-4 shadow-card focus-within:border-brand-500 focus-within:shadow-ring">
          <Search className="h-5 w-5 text-ink-400" />
          <input
            type="search"
            placeholder="Search help articles (e.g. 'verify owner', 'cancel boost')"
            className="ml-3 w-full bg-transparent text-[15px] placeholder:text-ink-400 focus:outline-none"
          />
        </label>
      </div>

      {/* Category tiles */}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <li key={c.title}>
            <a href={c.href} className="group flex h-full flex-col rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-500/40">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{c.icon}</span>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{c.title}</h3>
              <p className="mt-1 text-[12.5px] text-ink-500">{c.count} articles</p>
            </a>
          </li>
        ))}
      </ul>

      {/* FAQ sections */}
      {FAQ.map((s) => (
        <section key={s.id} id={s.id} className="mt-14 scroll-mt-24">
          <h2 className="text-display-md font-display text-ink-900">{s.section}</h2>
          <ul className="mt-6 surface-card divide-y divide-ink-200/70 overflow-hidden">
            {s.items.map((it) => (
              <li key={it.q}>
                <details className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="text-[14.5px] font-bold text-ink-900">{it.q}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-600">{it.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Bottom contact */}
      <section className="mt-14 rounded-3xl bg-brand-gradient p-8 text-center text-white lg:p-12">
        <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-md">
          <MessagesSquare className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-display-md font-display">Still need help?</h3>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] text-white/85">
          WhatsApp us at +91 7039125391 — replies in 30 min. Or email aapkaplots@gmail.com.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a href="https://wa.me/917039125391" target="_blank" rel="noopener noreferrer"
             className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold text-emerald-700">
            WhatsApp us
          </a>
          <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 text-[14px] font-bold text-white backdrop-blur">
            Contact form
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
