import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/Button";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { ArrowRight, MapPin } from "lucide-react";

const CITY_LABEL: Record<string, string> = {
  kolkata: "Kolkata",
  bengaluru: "Bengaluru",
  mumbai: "Mumbai",
  pune: "Pune",
  delhi: "Delhi NCR",
};

const KIND_LABEL: Record<string, { plural: string; singular: string; kind: string }> = {
  flats:       { plural: "Flats",            singular: "Flat",            kind: "flat" },
  houses:      { plural: "Houses",           singular: "House",           kind: "house" },
  plots:       { plural: "Plots",            singular: "Plot",            kind: "plot" },
  villas:      { plural: "Villas",           singular: "Villa",           kind: "villa" },
  commercial:  { plural: "Commercial",       singular: "Shop / Office",   kind: "shop" },
  agriculture: { plural: "Agriculture land", singular: "Agricultural Plot", kind: "agriculture" },
};

interface PageProps {
  params: Promise<{ city: string; kind: string }>;
}

export async function generateStaticParams() {
  const out: { city: string; kind: string }[] = [];
  for (const city of Object.keys(CITY_LABEL)) {
    for (const kind of Object.keys(KIND_LABEL)) {
      out.push({ city, kind });
    }
  }
  return out;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, kind } = await params;
  const cityLbl = CITY_LABEL[city];
  const kindLbl = KIND_LABEL[kind];
  if (!cityLbl || !kindLbl) return { title: "Not found" };
  const title = `${kindLbl.plural} in ${cityLbl} — Verified listings on AapKaPlot`;
  const description = `Browse ${kindLbl.plural.toLowerCase()} in ${cityLbl} with live maps, satellite view and AI investment scoring.`;
  return {
    title,
    description,
    alternates: { canonical: `/in/${city}/${kind}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CityKindPage({ params }: PageProps) {
  const { city, kind } = await params;
  const cityLbl = CITY_LABEL[city];
  const kindLbl = KIND_LABEL[kind];
  if (!cityLbl || !kindLbl) notFound();

  const matched = MOCK_PROPERTIES.filter(
    (p) =>
      p.location.city.toLowerCase() === cityLbl.toLowerCase() &&
      p.kind === kindLbl.kind
  );
  const sample = matched.length > 0 ? matched : MOCK_PROPERTIES.slice(0, 8);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-hero-radial py-12">
          <Container size="wide">
            <nav aria-label="Breadcrumb" className="text-[12.5px] text-ink-500">
              <Link href="/" className="hover:text-ink-800">Home</Link>
              <span className="px-1.5 text-ink-300">/</span>
              <Link href={`/in/${city}`} className="hover:text-ink-800">{cityLbl}</Link>
              <span className="px-1.5 text-ink-300">/</span>
              <span className="font-semibold text-ink-800">{kindLbl.plural}</span>
            </nav>
            <h1 className="mt-3 text-display-lg font-display text-ink-900 text-balance">
              {kindLbl.plural} in <span className="text-gradient-brand">{cityLbl}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-ink-600">
              Verified {kindLbl.plural.toLowerCase()} in {cityLbl} — AI-ranked by proximity, price competitiveness and trust score.
            </p>
            <div className="mt-5">
              <Link href={`/search?q=${encodeURIComponent(cityLbl)}&kind=${kindLbl.kind}`}>
                <Button variant="primary" size="md" iconRight={<ArrowRight className="h-4 w-4" />}>
                  Open advanced search
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        <section className="py-12">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">Featured {kindLbl.plural.toLowerCase()}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sample.slice(0, 8).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-white py-12">
          <Container size="wide">
            <h2 className="text-display-md font-display text-ink-900">About {kindLbl.plural.toLowerCase()} in {cityLbl}</h2>
            <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-ink-600">
              {cityLbl}'s {kindLbl.plural.toLowerCase()} market combines steady capital appreciation with strong rental demand. AapKaPlot lists only RERA-verified
              properties with documented title and live owner contact — so you can move from search to visit in minutes. Use our AI investment score to
              spot the best long-term picks across {cityLbl}.
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-500">
              <Link className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700 hover:bg-brand-100" href={`/in/${city}`}>← Back to {cityLbl}</Link>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-brand-500" /> India</span>
            </ul>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
