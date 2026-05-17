import { notFound, redirect } from "next/navigation";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { NewListingForm } from "@/components/seller/NewListingForm";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import type { AmenityId } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_TO_LOWER: Record<string, "plot" | "flat" | "house" | "villa" | "shop" | "office" | "warehouse" | "agriculture"> = {
  PLOT: "plot", FLAT: "flat", HOUSE: "house", VILLA: "villa",
  SHOP: "shop", OFFICE: "office", WAREHOUSE: "warehouse", AGRICULTURE: "agriculture",
};
const INTENT_TO_LOWER: Record<string, "buy" | "rent"> = {
  SELL: "buy", BUY: "buy", RENT: "rent",
};

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect(`/auth/login?next=/sell/edit/${(await params).id}`);

  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Edit listing" title="DB is off" subtitle="Edits require the live database." />
      </div>
    );
  }

  const { id } = await params;
  const p = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true, ownerId: true,
      kind: true, intent: true, title: true, description: true,
      bhk: true, areaSqft: true,
      locality: true, city: true, state: true, pincode: true,
      lat: true, lng: true, boundary: true,
      coverUrl: true, gallery: true, youtubeUrl: true, tourUrl: true,
      amenities: true, priceInr: true,
      allowsBrokers: true, brokerCommissionPct: true,
      roadEastFt: true, roadWestFt: true, roadNorthFt: true, roadSouthFt: true,
    },
  });
  if (!p) notFound();
  if (p.ownerId !== session.uid) {
    // Don't leak existence — pretend not found.
    notFound();
  }

  // Hydrate the Draft shape the form expects.
  const photos: { name: string; url: string }[] = [];
  if (p.coverUrl) photos.push({ name: "cover", url: p.coverUrl });
  for (const url of p.gallery ?? []) photos.push({ name: url, url });

  const boundary: [number, number][] = Array.isArray(p.boundary)
    ? (p.boundary as unknown as [number, number][])
    : [];

  const initial = {
    intent: INTENT_TO_LOWER[p.intent] ?? "buy",
    kind: KIND_TO_LOWER[p.kind],
    title: p.title,
    bhk: p.bhk ?? undefined,
    areaSqft: p.areaSqft ?? undefined,
    description: p.description ?? "",
    locality: p.locality ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    pincode: p.pincode ?? "",
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    boundary,
    // amenities in the DB are loosely-typed strings (older rows may use any
    // slug). Pass them through as-is — the form's checkbox grid silently
    // ignores unknown entries.
    amenities: ((p.amenities ?? []) as unknown as AmenityId[]),
    photos,
    youtubeUrl: p.youtubeUrl ?? undefined,
    tourUrl: p.tourUrl ?? undefined,
    priceInr: p.priceInr,
    negotiable: true,
    allowsBrokers: p.allowsBrokers ?? false,
    brokerCommissionPct: p.brokerCommissionPct ?? undefined,
    roadEastFt:  p.roadEastFt  ?? undefined,
    roadWestFt:  p.roadWestFt  ?? undefined,
    roadNorthFt: p.roadNorthFt ?? undefined,
    roadSouthFt: p.roadSouthFt ?? undefined,
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Edit listing"
        title={p.title}
        subtitle="Make changes and resubmit. Edits go back into the review queue."
      />
      <NewListingForm propertyId={p.id} initial={initial} />
    </div>
  );
}
