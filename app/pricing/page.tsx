import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  Building2,
  Crown,
  Zap,
  MapPin,
  PhoneCall,
  Handshake,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Pricing — Builder Plans & Site Visit Marketplace | AapKaPlot",
  description:
    "India ka sabse powerful property revenue system. Builder plans from ₹2,999/month. Pay only for real site visits. AI-powered lead generation.",
  alternates: { canonical: "/pricing" },
};

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "₹2,999",
    cadence: "/month",
    icon: <Building2 className="h-6 w-6" />,
    headerBg: "from-blue-600 to-blue-700",
    border: "border-blue-200",
    popular: false,
    perks: [
      "5 active listings",
      "AI property description",
      "WhatsApp inquiry button",
      "Basic lead dashboard",
      "OTP-verified leads",
      "Email support",
    ],
    cta: { label: "Start Free Trial", href: "/builder/subscribe?plan=STARTER" },
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: "₹9,999",
    cadence: "/month",
    icon: <Zap className="h-6 w-6" />,
    headerBg: "from-emerald-600 to-emerald-700",
    border: "border-emerald-400",
    popular: true,
    perks: [
      "50 active listings",
      "Featured homepage placement",
      "AI buyer matching (Grahak Match)",
      "WhatsApp auto-reply (Chinkki)",
      "Verified buyer leads",
      "SEO boost for all listings",
      "Lead quality scoring",
      "Priority support",
    ],
    cta: { label: "Start Growing", href: "/builder/subscribe?plan=GROWTH" },
  },
  {
    id: "DOMINATOR",
    name: "Dominator",
    price: "₹49,999",
    cadence: "/month",
    icon: <Crown className="h-6 w-6" />,
    headerBg: "from-amber-500 to-yellow-600",
    border: "border-amber-400",
    popular: false,
    perks: [
      "Unlimited listings",
      "City homepage sponsorship slot",
      "AI marketing copy + reel captions",
      "Dedicated relationship manager",
      "Guaranteed site visits",
      "YouTube + SEO promotion",
      "Full WhatsApp CRM",
      "ROI & funnel analytics",
      "24/7 SLA support",
    ],
    cta: {
      label: "Dominate Your City",
      href: "/builder/subscribe?plan=DOMINATOR",
    },
  },
];

const MARKETPLACE_ROWS = [
  {
    type: "Verified Lead",
    charge: "₹300 – ₹1,000",
    icon: <PhoneCall className="h-5 w-5 text-blue-500" />,
  },
  {
    type: "Site Visit Booked",
    charge: "₹1,500 – ₹5,000",
    icon: <MapPin className="h-5 w-5 text-emerald-500" />,
  },
  {
    type: "Deal Commission",
    charge: "0.5% – 1%",
    icon: <Handshake className="h-5 w-5 text-amber-500" />,
  },
];

const FAQS = [
  {
    q: "Kaunsa plan mere liye sahi hai?",
    a: "Agar aap abhi shuru kar rahe hain toh Starter plan lein. 10+ listings aur serious growth chahiye toh Growth plan best hai. Agar aap apne city mein #1 builder banna chahte hain toh Dominator — sirf serious players ke liye.",
  },
  {
    q: "Site Visit Marketplace kya hota hai?",
    a: "Aap sirf tab pay karte hain jab ek real, verified buyer aapki property dekhne aata hai. Koi hidden charge nahi, koi fake lead nahi. Pay-per-result model hai — aapka ROI guaranteed hai.",
  },
  {
    q: "Kya free trial mein credit card chahiye?",
    a: "Nahi. Starter plan ka free trial bina credit card ke start hota hai. 7 din baad aap decide karte hain ki plan continue karna hai ya nahi.",
  },
  {
    q: "Kya main kabhi bhi cancel kar sakta hoon?",
    a: "Haan, koi lock-in nahi hai. Aap mahine ke andar kabhi bhi cancel kar sakte hain. Aapka subscription current billing period ke end tak active rahega.",
  },
  {
    q: "Growth se Dominator mein upgrade kaise karein?",
    a: "Apne Builder Dashboard mein jaayein → Subscription → Upgrade. Pro-rata adjustment automatically calculate hoga aur balance aapke next invoice mein adjust hoga.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Section 1: Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 40%, #3b82f620 0%, transparent 60%), radial-gradient(circle at 75% 60%, #f59e0b18 0%, transparent 55%)",
            }}
            aria-hidden
          />
          <Container size="wide" className="relative py-20 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-widest text-amber-300">
                Builder Revenue System
              </span>
              <h1 className="font-display mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                India Ka Sabse Powerful
                <br />
                <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  Property Revenue System
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
                AI-powered listings, verified buyer leads, aur guaranteed site
                visits — sab ek jagah. Real results ke liye real tools.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="#builder-plans">
                  <Button variant="primary" size="lg">
                    Plans Dekho
                  </Button>
                </Link>
                <Link href="#site-visit-marketplace">
                  <Button variant="outline" size="lg">
                    Site Visit Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Section 2: Builder Plans ── */}
        <section id="builder-plans" className="bg-slate-50 py-20 lg:py-28">
          <Container size="wide">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                Builder Plans
              </h2>
              <p className="mt-3 text-slate-500">
                Monthly subscription. Cancel anytime. 7-day free trial on
                Starter.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-shadow hover:shadow-lg ${plan.border} ${
                    plan.popular
                      ? "ring-2 ring-emerald-500 ring-offset-2"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute right-4 top-4 z-10">
                      <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Card header */}
                  <div
                    className={`bg-gradient-to-br ${plan.headerBg} px-6 py-8 text-white`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/20 p-2">
                        {plan.icon}
                      </div>
                      <span className="text-lg font-bold uppercase tracking-wide">
                        {plan.name}
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold">
                        {plan.price}
                      </span>
                      <span className="ml-1 text-sm opacity-80">
                        {plan.cadence}
                      </span>
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="flex flex-1 flex-col px-6 py-6">
                    <ul className="flex-1 space-y-3">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          <span className="text-sm text-slate-700">{perk}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <Link href={plan.cta.href} className="block">
                        <Button
                          variant={plan.popular ? "primary" : "outline"}
                          size="md"
                          className="w-full justify-center"
                        >
                          {plan.cta.label}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Section 3: Site Visit Marketplace ── */}
        <section
          id="site-visit-marketplace"
          className="bg-white py-20 lg:py-28"
        >
          <Container size="wide">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700">
                  <MapPin className="h-3.5 w-3.5" />
                  Pay-Per-Result Model
                </span>
                <h2 className="font-display mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                  Pay Only For Real Site Visits
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-slate-500">
                  Fake leads se chutkara paayein. Sirf tab pay karein jab ek
                  verified buyer aapki property dekhne aata hai. Zero risk,
                  maximum ROI.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="px-8 py-4 text-sm font-semibold uppercase tracking-wider">
                        Service Type
                      </th>
                      <th className="px-8 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                        Charge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MARKETPLACE_ROWS.map((row, i) => (
                      <tr
                        key={row.type}
                        className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            {row.icon}
                            <span className="font-medium text-slate-800">
                              {row.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-slate-900">
                          {row.charge}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-center text-sm text-slate-400">
                Charges vary by city and property type. Final charge confirmed
                before booking.
              </p>

              <div className="mt-8 text-center">
                <Link href="/contact">
                  <Button variant="primary" size="lg">
                    Site Visit Marketplace Join Karein
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Section 4: FAQ ── */}
        <section className="bg-slate-50 py-20 lg:py-28">
          <Container size="wide">
            <div className="mx-auto max-w-3xl">
              <div className="mb-12 text-center">
                <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                  Aksar Puche Gaye Sawaal
                </h2>
                <p className="mt-3 text-slate-500">
                  Koi sawaal baaki hai? Hum yahan hain.
                </p>
              </div>

              <div className="space-y-4">
                {FAQS.map((faq, i) => (
                  <details
                    key={i}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 font-semibold text-slate-800 hover:text-slate-900">
                      <span>{faq.q}</span>
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100 px-6 pb-5 pt-4 text-slate-600">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center text-white">
                <h3 className="font-display text-2xl font-bold">
                  Shuru karo aaj hi
                </h3>
                <p className="mt-2 text-slate-300">
                  7-day free trial. No credit card required.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <Link href="/builder/subscribe?plan=STARTER">
                    <Button variant="primary" size="lg">
                      Free Trial Shuru Karo
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg">
                      Sales se baat karo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
