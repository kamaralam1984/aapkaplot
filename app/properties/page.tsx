import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { PropertyCard } from "@/components/property/PropertyCard";
import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { generateMockProperties } from "@/lib/property-generator";
import type { Property } from "@/lib/types";
import Link from "next/link";
import { SlidersHorizontal, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Properties — AapKaPlot",
  description: "Browse verified plots, flats, houses and commercial properties across India.",
};

const PAGE_SIZE = 12;

const KIND_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "plot", label: "Plot" },
  { value: "flat", label: "Flat" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "commercial", label: "Commercial" },
  { value: "agriculture", label: "Agriculture" },
];

const INTENT_OPTIONS = [
  { value: "", label: "Buy & Rent" },
  { value: "sell", label: "Buy" },
  { value: "rent", label: "Rent" },
];

const PRICE_OPTIONS = [
  { value: "", label: "Any Price" },
  { value: "0-500000", label: "Under ₹5L" },
  { value: "500000-2000000", label: "₹5L – ₹20L" },
  { value: "2000000-5000000", label: "₹20L – ₹50L" },
  { value: "5000000-10000000", label: "₹50L – ₹1Cr" },
  { value: "10000000-0", label: "Above ₹1Cr" },
];

function dbToProperty(p: {
  id: string; title: string; kind: string; intent: string; priceInr: number;
  previousPriceInr: number | null; areaSqft: number; bhk: number | null;
  locality: string; city: string; state: string; lat: number; lng: number;
  coverUrl: string; gallery: string[]; verified: boolean; trustScore: number;
  aiBadges: string[]; createdAt: Date; promotionTag: string | null;
}): Property {
  return {
    id: p.id,
    title: p.title,
    kind: p.kind as Property["kind"],
    intent: p.intent as Property["intent"],
    priceInr: p.priceInr,
    previousPriceInr: p.previousPriceInr ?? undefined,
    areaSqft: p.areaSqft,
    bhk: p.bhk ?? undefined,
    location: { locality: p.locality, city: p.city, state: p.state, coords: { lat: p.lat, lng: p.lng } },
    media: { cover: p.coverUrl, gallery: p.gallery },
    verified: p.verified,
    trustScore: p.trustScore,
    postedAt: p.createdAt.toISOString(),
    badges: p.aiBadges as Property["badges"],
    promotionTag: p.promotionTag ?? undefined,
  };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const params: Record<string, string> = await (searchParams ?? Promise.resolve({}));
  const kind = params.kind ?? "";
  const intent = params.intent ?? "";
  const price = params.price ?? "";
  const city = params.city ?? "";
  const q = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [minPrice, maxPrice] = price
    ? price.split("-").map(Number)
    : [0, 0];

  let properties: Property[] = [];
  let total = 0;

  if (process.env.USE_DB === "1") {
    const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };
    if (kind) where.kind = kind as Prisma.EnumPropertyKindFilter["equals"];
    if (intent) where.intent = intent as Prisma.EnumListingIntentFilter["equals"];
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (q) where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { locality: { contains: q, mode: "insensitive" } },
    ];
    if (minPrice) where.priceInr = { gte: minPrice, ...(maxPrice ? { lte: maxPrice } : {}) };

    [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, title: true, kind: true, intent: true, priceInr: true,
          previousPriceInr: true, areaSqft: true, bhk: true, locality: true,
          city: true, state: true, lat: true, lng: true, coverUrl: true,
          gallery: true, verified: true, trustScore: true, aiBadges: true, createdAt: true,
          promotionTag: true,
        },
      }).then((rows) => rows.map(dbToProperty)),
      prisma.property.count({ where }),
    ]);
  } else {
    const all = generateMockProperties(48);
    const filtered = all.filter((p) => {
      if (kind && p.kind !== kind) return false;
      if (intent && p.intent !== intent) return false;
      if (q && !p.title.toLowerCase().includes(q.toLowerCase()) && !p.location.city.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    total = filtered.length;
    properties = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function filterHref(updates: Record<string, string>) {
    const next = { kind, intent, price, city, q, page: "1", ...updates };
    const qs = Object.entries(next).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return `/properties${qs ? "?" + qs : ""}`;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pb-16">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-6">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink-900">All Properties</h1>
                <p className="text-[13px] text-ink-500 mt-0.5">
                  {total.toLocaleString("en-IN")} verified listings across India
                </p>
              </div>
              {/* Search */}
              <form method="GET" action="/properties" className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search city, locality, title…"
                    className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-700">
                  Search
                </button>
              </form>
            </div>
          </Container>
        </div>

        <Container className="mt-6">
          <div className="flex gap-6">
            {/* Filters sidebar */}
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-700">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">Property Type</p>
                  <div className="space-y-1">
                    {KIND_OPTIONS.map((o) => (
                      <Link key={o.value} href={filterHref({ kind: o.value })}
                        className={`block rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${kind === o.value ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-600 hover:bg-slate-50"}`}>
                        {o.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">Intent</p>
                  <div className="space-y-1">
                    {INTENT_OPTIONS.map((o) => (
                      <Link key={o.value} href={filterHref({ intent: o.value })}
                        className={`block rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${intent === o.value ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-600 hover:bg-slate-50"}`}>
                        {o.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">Price Range</p>
                  <div className="space-y-1">
                    {PRICE_OPTIONS.map((o) => (
                      <Link key={o.value} href={filterHref({ price: o.value })}
                        className={`block rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${price === o.value ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-600 hover:bg-slate-50"}`}>
                        {o.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              {/* Mobile filter pills */}
              <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
                {KIND_OPTIONS.slice(1).map((o) => (
                  <Link key={o.value} href={filterHref({ kind: o.value })}
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${kind === o.value ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-ink-600"}`}>
                    {o.label}
                  </Link>
                ))}
              </div>

              {properties.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-20 text-center text-ink-400">
                  <p className="text-[15px] font-medium">No properties found</p>
                  <p className="text-[13px] mt-1">Try changing your filters</p>
                  <Link href="/properties" className="mt-4 inline-block text-[13px] font-semibold text-brand-600 hover:underline">
                    Clear all filters
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link href={filterHref({ page: String(page - 1) })}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-ink-600 hover:bg-slate-50">
                      ← Prev
                    </Link>
                  )}
                  <span className="text-[13px] text-ink-500">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={filterHref({ page: String(page + 1) })}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-ink-600 hover:bg-slate-50">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
