import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, School, Hospital, Train, Banknote, ShoppingBag, Utensils, ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { CITY_CENTROIDS, DEFAULT_CENTROID } from "@/lib/city-centroids";
import { fetchLocalityInsight } from "@/lib/overpass";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ city: string; locality: string }>;
}

function prettify(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, locality } = await params;
  const cityName = prettify(decodeURIComponent(city));
  const localityName = prettify(decodeURIComponent(locality));
  return {
    title: `${localityName}, ${cityName} — Property prices, schools, hospitals & nearby amenities`,
    description: `Explore ${localityName} in ${cityName}: average prices, listings, schools, hospitals, metro stations and other amenities within 2 km.`,
    alternates: { canonical: `/in/${city}/area/${locality}` },
  };
}

export default async function LocalityPage({ params }: PageProps) {
  const { city, locality } = await params;
  const cityName = prettify(decodeURIComponent(city));
  const localityName = prettify(decodeURIComponent(locality));

  // Lat/lng: prefer a matching mock property in the locality, else city centroid.
  const sample = MOCK_PROPERTIES.find(
    (p) =>
      p.location.locality.toLowerCase() === localityName.toLowerCase() &&
      p.location.city.toLowerCase() === cityName.toLowerCase()
  );
  const centroid = CITY_CENTROIDS[cityName.toLowerCase()] ?? DEFAULT_CENTROID;
  const lat = sample?.location.coords.lat ?? centroid.lat;
  const lng = sample?.location.coords.lng ?? centroid.lng;

  if (!cityName || !localityName) notFound();

  const [insight, listings] = await Promise.all([
    fetchLocalityInsight(cityName, localityName, lat, lng).catch(() => null),
    Promise.resolve(
      MOCK_PROPERTIES.filter(
        (p) =>
          p.location.city.toLowerCase() === cityName.toLowerCase() &&
          p.location.locality.toLowerCase() === localityName.toLowerCase()
      )
    ),
  ]);

  const avgPrice =
    listings.length > 0
      ? listings.reduce((s, p) => s + p.priceInr, 0) / listings.length
      : 0;
  const avgPricePerSqft =
    listings.length > 0
      ? listings.reduce((s, p) => s + p.priceInr / Math.max(1, p.areaSqft), 0) / listings.length
      : 0;

  const a = insight?.amenities ?? { schools: 0, hospitals: 0, metro: 0, banks: 0, malls: 0, restaurants: 0 };

  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <section className="relative overflow-hidden bg-hero-radial">
          <Container size="wide" className="relative py-14 lg:py-20">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
              <MapPin className="h-3.5 w-3.5" /> {cityName}
            </p>
            <h1 className="mt-4 text-display-lg font-display text-ink-900">
              {localityName}, <span className="text-gradient-brand">{cityName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-600">
              Locality snapshot — average prices, neighbourhood amenities within 2 km, and active listings.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link href={`/search?q=${encodeURIComponent(localityName + " " + cityName)}`}>
                <Button variant="primary" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  Browse listings here
                </Button>
              </Link>
              <Link href={`/in/${city}`}>
                <Button variant="outline" size="lg">
                  All of {cityName}
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        <Container size="wide" className="py-10">
          {/* Price + listing stats */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Listings here" value={listings.length} sub="active" />
            <Stat
              label="Avg price"
              value={avgPrice ? formatInr(Math.round(avgPrice)) : "—"}
              sub="per listing"
            />
            <Stat
              label="Avg ₹/sqft"
              value={avgPricePerSqft ? formatInr(Math.round(avgPricePerSqft)) : "—"}
              sub="across all kinds"
            />
            <Stat
              label="Data freshness"
              value={
                insight
                  ? new Date(insight.fetchedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                  : "—"
              }
              sub={insight?.source === "cache" ? "(cached)" : insight?.source === "overpass" ? "(live OSM)" : ""}
            />
          </section>

          {/* Amenities grid */}
          <section className="mt-8">
            <h2 className="text-[16px] font-bold text-ink-900">
              Within 2 km of {localityName}
            </h2>
            <p className="text-[13px] text-ink-500">
              Counts sourced from OpenStreetMap (Overpass). Updates every 30 days.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Amenity icon={<School className="h-4 w-4" />} label="Schools" count={a.schools} tone="emerald" />
              <Amenity icon={<Hospital className="h-4 w-4" />} label="Hospitals & clinics" count={a.hospitals} tone="rose" />
              <Amenity icon={<Train className="h-4 w-4" />} label="Metro / rail" count={a.metro} tone="sky" />
              <Amenity icon={<Banknote className="h-4 w-4" />} label="Banks" count={a.banks} tone="amber" />
              <Amenity icon={<ShoppingBag className="h-4 w-4" />} label="Shopping malls" count={a.malls} tone="violet" />
              <Amenity icon={<Utensils className="h-4 w-4" />} label="Restaurants" count={a.restaurants} tone="amber" />
            </div>
          </section>

          {/* Active listings */}
          {listings.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[16px] font-bold text-ink-900">
                Active listings in {localityName}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.slice(0, 8).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 text-display-md font-display text-ink-900">{value}</p>
      {sub && <p className="text-[11.5px] text-ink-500">{sub}</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
};

function Amenity({
  icon, label, count, tone,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONE[tone]}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-700">{label}</p>
        <p className="text-display-md font-display text-ink-900">{count}</p>
      </div>
    </div>
  );
}
