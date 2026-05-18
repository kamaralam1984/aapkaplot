/**
 * Customer testimonials — anchors trust before the lead form.
 * Mock data kept here for now; swap with DB-driven reviews later.
 */
import Link from "next/link";

interface Testimonial {
  name: string;
  role: string;
  city: string;
  avatar: string;       // emoji or initials placeholder
  quote: string;
  highlight: string;    // outcome
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Animesh Kumar",
    role: "Plot Buyer",
    city: "Patna",
    avatar: "👨‍💼",
    quote: "AapKaPlot ke through Boring Road me 2400 sqft ka plot mila — clean title, transparent dealing. Pura process WhatsApp pe handled.",
    highlight: "Saved 3 months · ₹4 L below market",
  },
  {
    name: "Priya Sharma",
    role: "First-time Flat Buyer",
    city: "Patliputra",
    avatar: "👩‍💻",
    quote: "AI assistant ne meri family ke liye 3 BHK shortlist kiya — 12 listings filter karke 4 best options. Site visit bhi schedule ho gaya.",
    highlight: "Decision in 1 weekend",
  },
  {
    name: "Vikas Singh",
    role: "Real Estate Investor",
    city: "Multiple cities",
    avatar: "🏢",
    quote: "5 plots last year — Patna, Gaya, Muzaffarpur me. Verified ownership badge se confidence aata hai. Best platform for Bihar property.",
    highlight: "5 properties · 0 disputes",
  },
  {
    name: "Reshmi Yadav",
    role: "Tenant",
    city: "Kankarbagh",
    avatar: "🎓",
    quote: "Working professional hoon, rent search par koi time nahi tha. AapKaPlot ne 2 din me 2 BHK furnished mil gaya, owner verified, deposit fair.",
    highlight: "Moved in within 5 days",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-white to-ink-50/40">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Real buyers, real wins</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-display font-semibold text-ink-900">
            10,000+ families have already moved in through AapKaPlot
          </h2>
          <div className="mt-4 inline-flex items-center gap-4 text-sm text-ink-600">
            <span>⭐⭐⭐⭐⭐</span>
            <span><strong className="text-ink-900">4.8/5</strong> average rating</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline"><strong className="text-ink-900">98%</strong> would recommend</span>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/70 hover:shadow-lift transition">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-2xl">{t.avatar}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{t.name}</p>
                  <p className="text-xs text-ink-500">{t.role} · {t.city}</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
                  Verified
                </span>
              </div>
              <p className="mt-4 text-ink-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-3 text-[12px] font-semibold text-emerald-700">{t.highlight}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-center">
          <Stat value="10k+" label="Properties listed" />
          <Stat value="3.2k" label="Site visits booked" />
          <Stat value="₹420 Cr" label="Property value transacted" />
          <Stat value="45" label="Cities covered" />
        </div>

        <div className="mt-8 text-center">
          <Link href="/search" className="inline-flex rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105">
            Start your own success story →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-bold text-ink-900 font-display">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-ink-500">{label}</p>
    </div>
  );
}
