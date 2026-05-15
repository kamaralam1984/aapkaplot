import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Building2, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Pricing — Free, Premium & Builder plans",
  description:
    "Post your property free, or unlock featured placement, AI Recommendations slots, and verified-priority badges with a Premium or Builder plan.",
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cadence: "forever",
    icon: <Sparkles className="h-5 w-5" />,
    tone: "from-ink-200 to-ink-100",
    body: "Post your property and get verified leads with zero upfront cost.",
    perks: [
      "Up to 2 active listings",
      "Standard search visibility",
      "Verified phone OTP",
      "WhatsApp leads via owner DM",
      "Email + chat support",
    ],
    cta: { label: "Get started free", href: "/auth/login" },
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹999",
    cadence: "per listing / month",
    icon: <Crown className="h-5 w-5" />,
    tone: "from-emerald-200 to-emerald-100",
    featured: true,
    body: "For owners and agents who want top-of-search placement and faster leads.",
    perks: [
      "Unlimited active listings",
      "Top-of-search placement",
      "Homepage AI Recommendations slot",
      "Verified-priority badge",
      "Buyer chat with read receipts",
      "Lead analytics + WhatsApp routing",
      "Priority support",
    ],
    cta: { label: "Start Premium", href: "/checkout?plan=premium" },
  },
  {
    id: "builder",
    name: "Builder",
    price: "Custom",
    cadence: "talk to sales",
    icon: <Building2 className="h-5 w-5" />,
    tone: "from-violet-200 to-violet-100",
    body: "For developers with 25+ listings, project micro-sites and lead pipelines.",
    perks: [
      "Bulk listing API + import",
      "Branded project pages",
      "Dedicated account manager",
      "AI-generated brochures",
      "Heatmaps + demand reports",
      "SLA + 24/7 support",
    ],
    cta: { label: "Contact sales", href: "/contact" },
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-radial">
          <div className="absolute inset-0 grid-mask opacity-50" aria-hidden />
          <Container size="wide" className="relative py-16 lg:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Simple, transparent pricing
              </span>
              <h1 className="mt-4 text-display-lg font-display text-ink-900 text-balance">
                Plans that grow with your <span className="text-gradient-brand">listings</span>
              </h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-600">
                Start free. Upgrade when you're ready to dominate the top of search and homepage AI picks.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`surface-card relative flex flex-col overflow-hidden p-6 ${
                    p.featured ? "lg:scale-[1.03] ring-2 ring-brand-500/30 shadow-lift" : ""
                  }`}
                >
                  {p.featured && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2 py-0.5 text-[11px] font-bold text-white shadow-glow">
                      <Sparkles className="h-3 w-3" /> Most popular
                    </span>
                  )}
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${p.tone} text-ink-800`}>
                    {p.icon}
                  </span>
                  <h3 className="mt-4 text-[18px] font-bold text-ink-900">{p.name}</h3>
                  <p className="mt-1 text-[13px] text-ink-500">{p.body}</p>
                  <p className="mt-5 text-3xl font-bold tracking-tight text-ink-900">
                    {p.price}
                    <span className="ml-1 text-[12.5px] font-medium text-ink-500">{p.cadence}</span>
                  </p>
                  <ul className="mt-5 space-y-2 text-[13.5px] text-ink-700">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link href={p.cta.href} className="mt-6">
                    <Button variant={p.featured ? "primary" : "outline"} size="lg" className="w-full">
                      {p.cta.label}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-[12.5px] text-ink-500">
              All prices in INR. GST applicable. Cancel anytime.
            </p>
          </Container>
        </section>

        <section className="bg-white py-14">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">Frequently asked questions</h2>
            <dl className="mt-6 grid gap-4 lg:grid-cols-2">
              {[
                { q: "Is posting a property free?", a: "Yes. You can post up to 2 active listings on the Free plan with full lead delivery." },
                { q: "Do I pay per lead?", a: "No, leads are unmetered on all plans. We never charge per-lead fees." },
                { q: "Can I switch plans anytime?", a: "Yes — upgrades take effect instantly. Downgrades apply at the next billing cycle." },
                { q: "What payment methods do you support?", a: "UPI, all major credit/debit cards, NetBanking and bank transfer for Builder plans." },
              ].map((f) => (
                <div key={f.q} className="surface-card p-5">
                  <dt className="text-[14px] font-bold text-ink-900">{f.q}</dt>
                  <dd className="mt-1 text-[13.5px] text-ink-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
