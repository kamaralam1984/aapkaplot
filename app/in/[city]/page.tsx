import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/Button";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { formatInr } from "@/lib/format";

const CITY_HERO = {
  kolkata: {
    label: "Kolkata",
    state: "West Bengal",
    blurb: "From New Town's tech corridors to Sodepur's quiet streets — discover the best plots, flats and houses in Kolkata.",
  },
  bengaluru: { label: "Bengaluru", state: "Karnataka", blurb: "India's tech capital. Premium gated societies, gated plots and high-yield rentals across Bengaluru." },
  mumbai:    { label: "Mumbai",    state: "Maharashtra", blurb: "Sea-facing flats, suburban villas and investment plots across Mumbai's most active neighbourhoods." },
  pune:      { label: "Pune",      state: "Maharashtra", blurb: "Spacious 2 & 3 BHK options, plots and villas across Pune's fast-growing micro-markets." },
  delhi:     { label: "Delhi NCR", state: "Delhi", blurb: "From Greater Noida to Gurugram and South Delhi — find verified residential and commercial property." },
} as const;

const KIND_LINKS = [
  { slug: "flats",       label: "Flats",            kind: "flat" },
  { slug: "houses",      label: "Houses",           kind: "house" },
  { slug: "plots",       label: "Plots",            kind: "plot" },
  { slug: "villas",      label: "Villas",           kind: "villa" },
  { slug: "commercial",  label: "Commercial",       kind: "shop" },
  { slug: "agriculture", label: "Agriculture Land", kind: "agriculture" },
];

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CITY_HERO).map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const meta = CITY_HERO[city.toLowerCase() as keyof typeof CITY_HERO];
  if (!meta) return { title: "City not found" };
  const title = `Property in ${meta.label} — Flats, Plots, Houses & Commercial`;
  return {
    title,
    description: meta.blurb,
    alternates: { canonical: `/in/${city.toLowerCase()}` },
    openGraph: { title, description: meta.blurb, type: "website" },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const meta = CITY_HERO[city.toLowerCase() as keyof typeof CITY_HERO];
  if (!meta) notFound();

  // Sample properties from MOCK that match this city, else fall back to top 8.
  const listings = MOCK_PROPERTIES.filter(
    (p) => p.location.city.toLowerCase() === meta.label.toLowerCase()
  );
  const sample = listings.length > 0 ? listings : MOCK_PROPERTIES.slice(0, 8);

  const avg = sample.reduce((s, p) => s + p.priceInr, 0) / Math.max(1, sample.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${meta.label} — Property listings`,
    address: {
      "@type": "PostalAddress",
      addressLocality: meta.label,
      addressRegion: meta.state,
      addressCountry: "IN",
    },
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com"}/in/${city}`,
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-radial">
          <div className="absolute inset-0 grid-mask opacity-50" aria-hidden />
          <Container size="wide" className="relative py-14 lg:py-20">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
              <MapPin className="h-3.5 w-3.5" /> {meta.state}
            </p>
            <h1 className="mt-4 text-display-lg font-display text-ink-900 text-balance">
              Property in <span className="text-gradient-brand">{meta.label}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-600">
              {meta.blurb}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link href={`/search?q=${encodeURIComponent(meta.label)}`}>
                <Button variant="primary" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  See all {meta.label} listings
                </Button>
              </Link>
              <span className="text-[13px] text-ink-500">
                Avg. listing price · <span className="font-bold text-ink-900">{formatInr(avg)}</span>
              </span>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {KIND_LINKS.map((k) => (
                <li key={k.slug}>
                  <Link
                    href={`/in/${city}/${k.slug}`}
                    className="block rounded-2xl border border-ink-200/70 bg-white p-3 text-center text-[13px] font-semibold text-ink-800 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-500/40"
                  >
                    {k.label} <span className="ml-1 text-ink-400">in {meta.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section className="py-14">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">
              Latest in {meta.label}
            </h2>
            <p className="mt-1 text-[14px] text-ink-500">
              Verified listings curated by AapKaPlot.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sample.slice(0, 8).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </Container>
        </section>

        {/* Why this city */}
        <section className="bg-white py-14">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">
              Why buy in {meta.label}?
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {[
                { icon: <ShieldCheck className="h-5 w-5" />, title: "RERA verified", body: "Only listings from registered owners and developers." },
                { icon: <Sparkles className="h-5 w-5" />, title: "AI investment scoring", body: `Every property in ${meta.label} is scored on growth potential.` },
                { icon: <MapPin className="h-5 w-5" />, title: "Live nearby engine", body: "Filter by metro, school, hospital and market distance." },
              ].map((c) => (
                <div key={c.title} className="surface-card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{c.icon}</span>
                  <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">{c.title}</h3>
                  <p className="mt-1 text-[13px] text-ink-600">{c.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
