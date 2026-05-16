import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Blog — AapKaPlot",
  description: "Insights on Indian real estate — buying guides, market trends, neighbourhood deep-dives and tips from AapKaPlot.",
  alternates: { canonical: "/blog" },
};

const POSTS = [
  {
    slug: "first-time-buyer-guide-kolkata",
    title: "First-time buyer's guide to flats in Kolkata (2026 edition)",
    excerpt: "From Sodepur to Salt Lake — typical prices, key paperwork, RERA checks and the 5 micro-markets worth watching this year.",
    category: "Buyer guide",
    readMin: 9,
    date: "2026-04-22",
    cover: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70",
  },
  {
    slug: "verified-owner-badge-explained",
    title: "What does the Verified Owner badge mean?",
    excerpt: "We get this question a lot. Here's exactly what we check before a listing earns the green badge — and why it matters for buyers.",
    category: "Trust & safety",
    readMin: 4,
    date: "2026-04-05",
    cover: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=70",
  },
  {
    slug: "rera-registration-checklist",
    title: "RERA registration checklist before you buy any new-launch property",
    excerpt: "8 documents every buyer should verify before paying a token amount. Saves lakhs in legal hassles later.",
    category: "Legal",
    readMin: 6,
    date: "2026-03-19",
    cover: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70",
  },
  {
    slug: "new-town-vs-rajarhat",
    title: "New Town vs Rajarhat — which Kolkata corridor is the smarter buy?",
    excerpt: "Price per sqft, infrastructure pipeline, rental yield and 5-year appreciation history compared side-by-side.",
    category: "Market trends",
    readMin: 7,
    date: "2026-03-02",
    cover: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=70",
  },
  {
    slug: "ai-fraud-detection",
    title: "How AapKaPlot's AI catches fake listings before you see them",
    excerpt: "Inside our duplicate-image hashing, price z-score anomaly detection and the human-in-the-loop moderation queue.",
    category: "Engineering",
    readMin: 8,
    date: "2026-02-12",
    cover: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70",
  },
  {
    slug: "agricultural-land-india-investment",
    title: "Investing in agricultural land — what you can and can't do in India",
    excerpt: "State-by-state rules, conversion options and where the highest legal yields are this year.",
    category: "Investment",
    readMin: 10,
    date: "2026-01-28",
    cover: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=70",
  },
];

const CATEGORIES = ["All", "Buyer guide", "Trust & safety", "Legal", "Market trends", "Engineering", "Investment"];

export default function BlogPage() {
  const [hero, ...rest] = POSTS;

  return (
    <MarketingShell
      eyebrow="Blog"
      title="Smart property reads from the AapKaPlot team"
      subtitle="Buying guides, market deep-dives, legal explainers and engineering posts — written for Indian buyers, sellers and investors."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
    >
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={
              "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition " +
              (c === "All"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* Hero post */}
      <article className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Link href={`/blog/${hero.slug}`} className="group block overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
            <Image src={hero.cover} alt={hero.title} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" priority />
          </div>
        </Link>
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-brand-700">
            {hero.category}
          </span>
          <h2 className="mt-3 text-display-md font-display text-ink-900">
            <Link href={`/blog/${hero.slug}`} className="hover:underline">{hero.title}</Link>
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">{hero.excerpt}</p>
          <p className="mt-4 inline-flex items-center gap-3 text-[12.5px] text-ink-500">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(hero.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {hero.readMin} min</span>
          </p>
          <Link href={`/blog/${hero.slug}`} className="mt-5 inline-flex w-fit items-center gap-1 rounded-xl bg-brand-gradient px-4 py-2.5 text-[13.5px] font-bold text-white shadow-glow">
            Read article <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>

      {/* Recent grid */}
      <h3 className="mt-14 text-display-md font-display text-ink-900">Recent posts</h3>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <li key={p.slug} className="surface-card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card">
            <Link href={`/blog/${p.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
              <Image src={p.cover} alt={p.title} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover transition-transform duration-500 hover:scale-[1.03]" />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-brand-700">
                {p.category}
              </span>
              <h4 className="text-[15.5px] font-bold leading-snug text-ink-900">
                <Link href={`/blog/${p.slug}`} className="hover:underline">{p.title}</Link>
              </h4>
              <p className="line-clamp-2 text-[12.5px] text-ink-600">{p.excerpt}</p>
              <p className="mt-auto inline-flex items-center gap-3 text-[11.5px] text-ink-500">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readMin} min</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Subscribe band */}
      <section className="mt-14 rounded-3xl bg-brand-gradient p-8 text-white lg:p-12">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h3 className="text-display-md font-display">Get the weekly newsletter</h3>
            <p className="mt-2 max-w-xl text-[14.5px] text-white/85">
              One email every Friday — new listings near you, market signals, and the best long-reads from the AapKaPlot team.
            </p>
          </div>
          <form className="flex h-12 overflow-hidden rounded-xl border border-white/40 bg-white/10 backdrop-blur">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 bg-transparent px-3 text-[14px] text-white placeholder:text-white/60 focus:outline-none"
            />
            <button type="submit" className="bg-white px-5 text-[13.5px] font-bold text-emerald-700 hover:brightness-95">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}
