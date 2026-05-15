/**
 * Data repository for properties. Routes pages through either the live
 * Prisma DB or the in-memory mock catalogue depending on `USE_DB`.
 *
 * Pages should import from here, never from `lib/mock-data` directly,
 * so flipping `USE_DB=1` is a single environment change.
 */
import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

const USE_DB = process.env.USE_DB === "1";

interface NearbyOpts {
  lat: number;
  lng: number;
  radiusKm: number;
  limit?: number;
}

/** Returns the full property catalogue. */
export async function listProperties(): Promise<Property[]> {
  if (!USE_DB) return MOCK_PROPERTIES;
  const { prisma } = await import("@/server/db");
  const rows = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToProperty);
}

/** Lookup a single property by id. */
export async function getProperty(id: string): Promise<Property | null> {
  if (!USE_DB) return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
  const { prisma } = await import("@/server/db");
  const row = await prisma.property.findUnique({ where: { id } });
  return row ? rowToProperty(row) : null;
}

/** Nearby search — uses PostGIS in DB mode, Haversine in mock mode. */
export async function findNearby(opts: NearbyOpts): Promise<(Property & { distanceKm: number })[]> {
  if (!USE_DB) {
    const { haversineKm } = await import("@/lib/haversine");
    const origin = { lat: opts.lat, lng: opts.lng };
    const limit = opts.limit ?? 24;
    return MOCK_PROPERTIES
      .map((p) => ({ ...p, distanceKm: haversineKm(origin, p.location.coords) }))
      .filter((p) => p.distanceKm <= opts.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }
  const { findNearbyProperties } = await import("@/server/property/geo");
  const rows = await findNearbyProperties(opts);
  return rows.map((r: any) => ({
    ...rowToProperty(r),
    distanceKm: Number(r.distance_km ?? 0),
  }));
}

/** Re-export the canonical origin so server pages can fall back consistently. */
export const ORIGIN = DEFAULT_ORIGIN;

/* ------------------------------------------------------------------ */
/* Internal: map Prisma row -> public Property type                    */
/* ------------------------------------------------------------------ */

function rowToProperty(row: any): Property {
  const KIND: Record<string, Property["kind"]> = {
    PLOT: "plot", FLAT: "flat", HOUSE: "house", VILLA: "villa",
    SHOP: "shop", OFFICE: "office", WAREHOUSE: "warehouse", AGRICULTURE: "agriculture",
  };
  const INTENT: Record<string, Property["intent"]> = {
    BUY: "buy", RENT: "rent", SELL: "sell",
  };
  return {
    id: row.id,
    title: row.title,
    kind: KIND[row.kind] ?? "flat",
    intent: INTENT[row.intent] ?? "buy",
    priceInr: row.priceInr,
    previousPriceInr: row.previousPriceInr ?? undefined,
    areaSqft: row.areaSqft,
    bhk: row.bhk ?? undefined,
    location: {
      locality: row.locality,
      city: row.city,
      state: row.state,
      coords: { lat: row.lat, lng: row.lng },
    },
    media: {
      cover: row.coverUrl,
      gallery: Array.isArray(row.gallery) ? row.gallery : undefined,
      video: row.videoUrl ?? undefined,
      satellite: row.satelliteUrl ?? undefined,
    },
    verified: row.verified,
    trustScore: row.trustScore,
    postedAt: (row.createdAt ?? new Date()).toISOString(),
    badges: Array.isArray(row.aiBadges) ? row.aiBadges : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  };
}
