import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, BadgeCheck, Check, Minus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { formatInr, formatArea } from "@/lib/format";
import { AMENITIES_CATALOG } from "@/lib/property-detail";
import type { Property } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare properties",
  description: "Compare up to 3 verified properties side-by-side — price, amenities, location, area and trust score.",
  alternates: { canonical: "/compare" },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

/**
 * Compare 2–3 properties side-by-side. Reads ids from ?ids=p_001,p_002.
 *
 * Uses MOCK_PROPERTIES as the catalogue source — when the public property
 * API lands, swap with a server-side fetch by id list.
 */
export default async function ComparePage({ searchParams }: PageProps) {
  const { ids: raw } = await searchParams;
  const ids = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const items = ids
    .map((id) => MOCK_PROPERTIES.find((p) => p.id === id))
    .filter((p): p is Property => !!p);

  return (
    <>
      <Navbar />
      <main className="py-10">
        <Container size="wide">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/search"
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-soft hover:bg-ink-50"
              aria-label="Back to search"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-display-md font-display text-ink-900">Compare properties</h1>
              <p className="text-[13px] text-ink-500">
                {items.length === 0
                  ? "Add 2–3 properties from any listing card to compare side-by-side."
                  : `${items.length} of 3 selected`}
              </p>
            </div>
          </div>

          {items.length < 2 ? (
            <EmptyState />
          ) : (
            <CompareTable items={items} />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

function EmptyState() {
  return (
    <div className="surface-card grid place-items-center gap-3 p-12 text-center">
      <p className="text-display-md font-display text-ink-900">Pick 2 or 3 listings to compare</p>
      <p className="max-w-md text-[13.5px] text-ink-500">
        On every property card, tap the <strong>Compare</strong> checkbox. A floating dock will appear
        with a “Compare” button to bring you here.
      </p>
      <Link href="/search">
        <Button variant="primary" size="md">Browse properties</Button>
      </Link>
    </div>
  );
}

function CompareTable({ items }: { items: Property[] }) {
  // Union of all amenity ids across the picked items.
  const amenityIds = Array.from(
    new Set(items.flatMap((p) => p.amenities ?? []))
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-44 bg-white pb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-500"></th>
            {items.map((p) => (
              <th key={p.id} className="px-3 pb-3 align-top">
                <div className="surface-card overflow-hidden p-0">
                  <Link
                    href={`/property/${p.id}`}
                    className="relative block aspect-[16/10] overflow-hidden bg-ink-100"
                  >
                    <Image src={p.media.cover} alt={p.title} fill sizes="(min-width:1024px) 320px, 50vw" className="object-cover" />
                  </Link>
                  <div className="p-3">
                    <p className="truncate text-[14px] font-bold text-ink-900">{p.title}</p>
                    <p className="inline-flex items-center gap-1 text-[12px] text-ink-500">
                      <MapPin className="h-3 w-3 text-brand-500" />
                      {p.location.locality}, {p.location.city}
                    </p>
                    <p className="mt-1 text-[15px] font-bold text-emerald-700">
                      {formatInr(p.priceInr)}
                    </p>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13.5px]">
          <Row label="Type" cells={items.map((p) => p.kind)} />
          <Row label="Intent" cells={items.map((p) => p.intent.charAt(0).toUpperCase() + p.intent.slice(1))} />
          <Row label="BHK" cells={items.map((p) => (p.bhk ? `${p.bhk} BHK` : "—"))} />
          <Row label="Area" cells={items.map((p) => formatArea(p.areaSqft))} />
          <Row label="Price" cells={items.map((p) => formatInr(p.priceInr))} />
          <Row
            label="Price / sqft"
            cells={items.map((p) => formatInr(Math.round(p.priceInr / Math.max(1, p.areaSqft))))}
          />
          <Row label="Furnishing" cells={items.map((p) => p.furnishing ?? "—")} />
          <Row label="Parking" cells={items.map((p) => (p.hasParking ? "Yes" : "—"))} />
          <Row
            label="Trust"
            cells={items.map((p) => (
              <span className="inline-flex items-center gap-1">
                {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                {p.trustScore}/100
              </span>
            ))}
          />
          <Row
            label="Near metro"
            cells={items.map((p) =>
              p.nearbyKm?.metro != null ? `${p.nearbyKm.metro.toFixed(1)} km` : "—"
            )}
          />
          <Row
            label="Near school"
            cells={items.map((p) =>
              p.nearbyKm?.school != null ? `${p.nearbyKm.school.toFixed(1)} km` : "—"
            )}
          />

          <tr>
            <td colSpan={items.length + 1} className="px-3 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Amenities</p>
            </td>
          </tr>

          {amenityIds.map((aid) => {
            const a = AMENITIES_CATALOG[aid as keyof typeof AMENITIES_CATALOG];
            const label = a?.label ?? aid;
            return (
              <Row
                key={aid}
                label={label}
                cells={items.map((p) =>
                  p.amenities?.includes(aid as never) ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-label="Yes" />
                  ) : (
                    <Minus className="h-4 w-4 text-ink-300" aria-label="No" />
                  )
                )}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr>
      <th className="sticky left-0 z-10 w-44 bg-white py-2 pr-4 text-left text-[12.5px] font-semibold text-ink-500">
        {label}
      </th>
      {cells.map((c, i) => (
        <td
          key={i}
          className="border-t border-ink-200/70 px-3 py-2 align-top text-[13.5px] text-ink-900"
        >
          {c}
        </td>
      ))}
    </tr>
  );
}
