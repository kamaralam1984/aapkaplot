/**
 * DB → PropertyDetail mapper. Used as a fallback on /property/[id] when
 * the mock catalogue doesn't have the id (i.e. the property was created
 * via /api/property/create and lives in Postgres only).
 *
 * Rich fields (insights, nearby, monthly trend) get synthesised with
 * sensible defaults so the existing UI components keep rendering.
 */
import { prisma } from "@/server/db";
import type { PropertyDetail, PropertyKind, ListingIntent, AmenityId } from "@/lib/types";
import { computeTrustScore } from "@/lib/trust-score";

const KIND_TO_LOWER: Record<string, PropertyKind> = {
  PLOT: "plot", FLAT: "flat", HOUSE: "house", VILLA: "villa",
  SHOP: "shop", OFFICE: "office", WAREHOUSE: "warehouse", AGRICULTURE: "agriculture",
};
const INTENT_TO_LOWER: Record<string, ListingIntent> = {
  BUY: "buy", RENT: "rent", SELL: "sell",
};

export async function loadPropertyDetailFromDb(id: string): Promise<PropertyDetail | null> {
  if (process.env.USE_DB !== "1") return null;

  const r = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, phone: true, role: true, aadhaarVerified: true, createdAt: true } },
    },
  }).catch(() => null);
  if (!r) return null;

  const pricePerSqft = Math.round(r.priceInr / Math.max(1, r.areaSqft));
  const owner = r.owner;
  const verifiedOwner = !!owner.aadhaarVerified;

  const trustScore = r.trustScore > 0 ? r.trustScore : computeTrustScore({
    ownerAadhaarVerified: verifiedOwner,
    adminVerified: r.verified,
    coverUrl: r.coverUrl,
    galleryCount: r.gallery?.length ?? 0,
    hasVideo: !!r.videoUrl,
    hasYoutube: !!r.youtubeUrl,
    hasTour: !!r.tourUrl,
    hasBoundary: !!r.boundary,
    descriptionLength: (r.description ?? "").length,
    hasCoords: r.lat != null && r.lng != null,
    hasPincode: !!r.pincode,
    amenitiesCount: (r.amenities as string[] | null)?.length ?? 0,
    priceInr: r.priceInr,
    areaSqft: r.areaSqft,
    bhk: r.bhk,
    kind: r.kind,
  });

  const comparables = await prisma.property.findMany({
    where: {
      id: { not: r.id },
      kind: r.kind,
      intent: r.intent,
      city: r.city,
      OR: [{ locality: r.locality }, { locality: { contains: r.locality, mode: "insensitive" } }],
      areaSqft: { gt: 0 },
      priceInr: { gt: 0 },
    },
    select: { priceInr: true, areaSqft: true },
    take: 50,
  }).catch(() => [] as { priceInr: number; areaSqft: number }[]);

  let areaPricePerSqft = pricePerSqft;
  if (comparables.length >= 3) {
    const rates = comparables.map((c) => c.priceInr / Math.max(1, c.areaSqft)).sort((a, b) => a - b);
    const trimmed = rates.slice(Math.floor(rates.length * 0.1), Math.ceil(rates.length * 0.9));
    const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
    areaPricePerSqft = Math.round(avg);
  } else {
    const cityComps = await prisma.property.findMany({
      where: {
        id: { not: r.id },
        kind: r.kind,
        intent: r.intent,
        city: r.city,
        areaSqft: { gt: 0 },
        priceInr: { gt: 0 },
      },
      select: { priceInr: true, areaSqft: true },
      take: 100,
    }).catch(() => [] as { priceInr: number; areaSqft: number }[]);
    if (cityComps.length >= 3) {
      const rates = cityComps.map((c) => c.priceInr / Math.max(1, c.areaSqft)).sort((a, b) => a - b);
      const trimmed = rates.slice(Math.floor(rates.length * 0.1), Math.ceil(rates.length * 0.9));
      areaPricePerSqft = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length);
    }
  }

  const priceVsArea: "below" | "fair" | "above" =
    pricePerSqft < areaPricePerSqft * 0.97 ? "below"
    : pricePerSqft > areaPricePerSqft * 1.03 ? "above"
    : "fair";

  return {
    id: r.id,
    title: r.title,
    kind: KIND_TO_LOWER[r.kind] ?? "flat",
    intent: INTENT_TO_LOWER[r.intent] ?? "buy",
    priceInr: r.priceInr,
    previousPriceInr: r.previousPriceInr ?? undefined,
    areaSqft: r.areaSqft,
    bhk: r.bhk ?? undefined,
    location: {
      locality: r.locality,
      city: r.city,
      state: r.state,
      coords: { lat: r.lat, lng: r.lng },
    },
    media: {
      cover: r.coverUrl,
      gallery: r.gallery,
      video: r.videoUrl ?? undefined,
      satellite: r.satelliteUrl ?? undefined,
    },
    verified: r.verified || verifiedOwner,
    trustScore,
    postedAt: r.createdAt.toISOString(),
    badges: (r.aiBadges as PropertyDetail["badges"]) ?? [],
    amenities: (r.amenities as AmenityId[]) ?? [],
    description: r.description ?? "",
    features: {
      bedrooms: r.bhk ?? undefined,
      furnishing: undefined,
    },
    videoUrl: r.videoUrl ?? undefined,
    youtubeUrl: r.youtubeUrl ?? undefined,
    panoFrames: r.panoFrames ?? undefined,
    owner: {
      id: owner.id,
      name: owner.name ?? owner.phone,
      role: owner.role === "AGENT" ? "agent" : owner.role === "ADMIN" ? "owner" : "owner",
      verified: verifiedOwner,
      joinedAt: owner.createdAt.toISOString(),
      phoneMasked: owner.phone.replace(/^(\+\d{2})\d{6}/, "$1xxxxxx"),
      responseRateHours: 6,
    },
    nearby: [],
    insights: {
      trustScore,
      investmentScore: Math.min(95, 50 + Math.round(trustScore / 3)),
      priceVsArea,
      pricePerSqft,
      areaPricePerSqft,
      monthlyTrend: [],
      highlights: r.description
        ? [r.description.slice(0, 120)]
        : [`${r.bhk ? r.bhk + " BHK · " : ""}${r.areaSqft} sqft in ${r.locality}.`],
    },
  };
}
