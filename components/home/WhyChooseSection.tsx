/**
 * Why-Choose AapKaPlot — five trust pillars rendered as iconographic
 * cards on a glassmorphism backdrop.
 */
import Link from "next/link";

const PILLARS = [
  { icon: "✓", color: "emerald", title: "Verified properties", text: "Every listing is site-visited and ID-verified before it goes live. Scam-proof browsing." },
  { icon: "🤖", color: "indigo",  title: "AI-powered matching", text: "Real-time price/area/locality ranking surfaces the right options first — not what paid most." },
  { icon: "💬", color: "teal",    title: "WhatsApp-first support", text: "Talk to a real expert on WhatsApp in seconds. No call-centre runaround." },
  { icon: "📑", color: "amber",   title: "Fast registration help", text: "End-to-end docs help — title check, agreement drafting, registration office liaison." },
  { icon: "🏙", color: "rose",    title: "Local property experts", text: "On-ground teams in Patna, Bihar Sharif, Gaya, and growing across India." },
];

const COLOR_MAP = {
  emerald: { ring: "ring-emerald-100", soft: "bg-emerald-50", text: "text-emerald-700" },
  indigo:  { ring: "ring-indigo-100",  soft: "bg-indigo-50",  text: "text-indigo-700" },
  teal:    { ring: "ring-teal-100",    soft: "bg-teal-50",    text: "text-teal-700" },
  amber:   { ring: "ring-amber-100",   soft: "bg-amber-50",   text: "text-amber-800" },
  rose:    { ring: "ring-rose-100",    soft: "bg-rose-50",    text: "text-rose-700" },
} as const;

export function WhyChooseSection() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Why AapKaPlot</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-display font-semibold text-ink-900">
            India's most trusted real estate platform
          </h2>
          <p className="mt-3 text-ink-700">
            Built for buyers, renters, and serious investors who want to skip the noise and act on real, verified information.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => {
            const c = COLOR_MAP[p.color as keyof typeof COLOR_MAP];
            return (
              <div key={p.title} className={`rounded-2xl bg-white p-6 ring-1 ${c.ring} hover:shadow-lift transition`}>
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${c.soft} ${c.text} text-2xl`}>{p.icon}</span>
                <h3 className="mt-4 font-semibold text-ink-900 text-lg">{p.title}</h3>
                <p className="mt-2 text-sm text-ink-600 leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/about" className="inline-flex rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
            Read our story →
          </Link>
        </div>
      </div>
    </section>
  );
}
