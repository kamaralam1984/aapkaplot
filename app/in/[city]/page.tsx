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
import { CITY_CENTROIDS } from "@/lib/city-centroids";
import { formatInr } from "@/lib/format";

export const PATNA_LOCALITIES = [
  { slug: "boring-road",        label: "Boring Road",        blurb: "Patna ka premium residential area — banks, schools aur hospitals sab paas" },
  { slug: "kankarbagh",         label: "Kankarbagh",         blurb: "Affordable flats aur plots — family-friendly colony with markets nearby" },
  { slug: "bailey-road",        label: "Bailey Road",        blurb: "Patna ka busiest corridor — great connectivity aur commercial value" },
  { slug: "rajendra-nagar",     label: "Rajendra Nagar",     blurb: "Well-planned colony — Patna University paas, peaceful residential zone" },
  { slug: "patliputra-colony",  label: "Patliputra Colony",  blurb: "High-demand locality — gated societies aur wide roads" },
  { slug: "danapur",            label: "Danapur",            blurb: "Fast-growing suburb — affordable plots with railway connectivity" },
  { slug: "gardanibagh",        label: "Gardanibagh",        blurb: "Central Patna — mixed-use locality with good public transport" },
  { slug: "phulwari-sharif",    label: "Phulwari Sharif",    blurb: "Budget-friendly area — Patna outskirts with growing infrastructure" },
  { slug: "digha",              label: "Digha",              blurb: "Near Ganga ghat — plots aur houses at competitive prices" },
  { slug: "anisabad",           label: "Anisabad",           blurb: "Well-connected locality — near Patna Junction, ideal for investment" },
  { slug: "frazer-road",        label: "Frazer Road",        blurb: "Commercial heart of Patna — offices aur shops ka hub" },
  { slug: "exhibition-road",    label: "Exhibition Road",    blurb: "Central Patna — government offices aur residential mix" },
  { slug: "mithapur",           label: "Mithapur",           blurb: "Near bus stand — affordable housing with good connectivity" },
  { slug: "pahari",             label: "Pahari",             blurb: "Quiet residential zone — near Patna Sahib gurudwara" },
  { slug: "kadamkuan",          label: "Kadamkuan",          blurb: "Urban locality — near courts and government offices" },
];

interface CityMeta {
  label: string;
  state: string;
  blurb: string;
}

const CITY_HERO: Record<string, CityMeta> = {
  patna:     { label: "Patna",     state: "Bihar",        blurb: "Bihar ki rajdhani Patna mein plots, flats aur ghar khojein — Boring Road se Kankarbagh tak, Bailey Road se Rajendra Nagar tak. AapKaPlot pe verified listings milein." },
  kolkata:   { label: "Kolkata",   state: "West Bengal", blurb: "From New Town's tech corridors to Sodepur's quiet streets — discover the best plots, flats and houses in Kolkata." },
  bengaluru: { label: "Bengaluru", state: "Karnataka",   blurb: "India's tech capital. Premium gated societies, gated plots and high-yield rentals across Bengaluru." },
  mumbai:    { label: "Mumbai",    state: "Maharashtra", blurb: "Sea-facing flats, suburban villas and investment plots across Mumbai's most active neighbourhoods." },
  pune:      { label: "Pune",      state: "Maharashtra", blurb: "Spacious 2 & 3 BHK options, plots and villas across Pune's fast-growing micro-markets." },
  delhi:     { label: "Delhi NCR", state: "Delhi",       blurb: "From Greater Noida to Gurugram and South Delhi — find verified residential and commercial property." },
};

// State map for cities we know coords for but didn't write a custom blurb.
const CITY_STATE: Record<string, string> = {
  patna: "Bihar", lucknow: "Uttar Pradesh", kanpur: "Uttar Pradesh",
  agra: "Uttar Pradesh", varanasi: "Uttar Pradesh", noida: "Uttar Pradesh",
  ghaziabad: "Uttar Pradesh", "new delhi": "Delhi", gurgaon: "Haryana",
  gurugram: "Haryana", faridabad: "Haryana", chandigarh: "Chandigarh",
  hyderabad: "Telangana", chennai: "Tamil Nadu", coimbatore: "Tamil Nadu",
  ahmedabad: "Gujarat", surat: "Gujarat", vadodara: "Gujarat",
  jaipur: "Rajasthan", nagpur: "Maharashtra", nashik: "Maharashtra",
  indore: "Madhya Pradesh", bhopal: "Madhya Pradesh", raipur: "Chhattisgarh",
  ranchi: "Jharkhand", bhubaneswar: "Odisha", guwahati: "Assam",
  ludhiana: "Punjab", amritsar: "Punjab", kochi: "Kerala",
  thiruvananthapuram: "Kerala", hooghly: "West Bengal", howrah: "West Bengal",
};

function prettify(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Resolve a city slug to display metadata. Curated entries win; anything
 * with a known centroid gets an auto-generated blurb so /in/patna,
 * /in/lucknow etc. render instead of 404-ing.
 */
function resolveCityMeta(slug: string): CityMeta | null {
  const key = slug.toLowerCase();
  if (CITY_HERO[key]) return CITY_HERO[key];
  if (CITY_CENTROIDS[key]) {
    const label = prettify(key);
    return {
      label,
      state: CITY_STATE[key] ?? "India",
      blurb: `Find verified plots, flats and houses across ${label}. New listings every day.`,
    };
  }
  return null;
}

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
  // Curated + every city we have a centroid for — that's the long-tail.
  const all = new Set<string>([...Object.keys(CITY_HERO), ...Object.keys(CITY_CENTROIDS)]);
  return Array.from(all).map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const meta = resolveCityMeta(city);
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
  const meta = resolveCityMeta(city);
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

        {city === "patna" && (
          <section className="py-14 bg-ink-50/50">
            <Container size="wide">
              <h2 className="text-display-md font-display text-ink-900">
                Popular Localities in Patna
              </h2>
              <p className="mt-1 text-[14px] text-ink-500">
                Explore properties by neighbourhood across Patna.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PATNA_LOCALITIES.map((loc) => (
                  <Link
                    key={loc.slug}
                    href={`/in/patna/area/${loc.slug}`}
                    className="block rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-500/40"
                  >
                    <p className="text-[14px] font-bold text-ink-900">{loc.label}</p>
                    <p className="mt-1 text-[12.5px] text-ink-500 leading-snug">{loc.blurb}</p>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

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
