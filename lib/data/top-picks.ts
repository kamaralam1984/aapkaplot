/**
 * Top-of-home rails: Latest, Sponsored, Best Deals.
 *
 * Mock-first, DB-fallback — same pattern as `lib/data/properties.ts`.
 * Each helper returns at most `limit` properties (default 8) in the public
 * Property shape so existing rail components can render them directly.
 */
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

const USE_DB = () => process.env.USE_DB === "1";

interface RowSlice {
  id: string;
  title: string;
  kind: string;
  intent: string;
  priceInr: number;
  previousPriceInr: number | null;
  areaSqft: number;
  bhk: number | null;
  locality: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  coverUrl: string;
  gallery: string[];
  videoUrl: string | null;
  satelliteUrl: string | null;
  verified: boolean;
  trustScore: number;
  amenities: string[];
  aiBadges: string[];
  createdAt: Date;
  featuredUntil: Date | null;
  boostedUntil: Date | null;
}

const KIND_TO_LOWER: Record<string, Property["kind"]> = {
  PLOT: "plot", FLAT: "flat", HOUSE: "house", VILLA: "villa",
  SHOP: "shop", OFFICE: "office", WAREHOUSE: "warehouse", AGRICULTURE: "agriculture",
};
const INTENT_TO_LOWER: Record<string, Property["intent"]> = {
  BUY: "buy", RENT: "rent", SELL: "sell",
};

function rowToProperty(r: RowSlice): Property {
  return {
    id: r.id,
    title: r.title,
    kind: KIND_TO_LOWER[r.kind] ?? "flat",
    intent: INTENT_TO_LOWER[r.intent] ?? "buy",
    priceInr: r.priceInr,
    previousPriceInr: r.previousPriceInr ?? undefined,
    areaSqft: r.areaSqft,
    bhk: r.bhk ?? undefined,
    location: { locality: r.locality, city: r.city, state: r.state, coords: { lat: r.lat, lng: r.lng } },
    media: { cover: r.coverUrl, gallery: r.gallery, video: r.videoUrl ?? undefined, satellite: r.satelliteUrl ?? undefined },
    verified: r.verified,
    trustScore: r.trustScore,
    postedAt: r.createdAt.toISOString(),
    badges: r.aiBadges as Property["badges"],
    amenities: r.amenities as Property["amenities"],
  };
}

const SELECT = {
  id: true, title: true, kind: true, intent: true,
  priceInr: true, previousPriceInr: true, areaSqft: true, bhk: true,
  locality: true, city: true, state: true,
  lat: true, lng: true,
  coverUrl: true, gallery: true, videoUrl: true, satelliteUrl: true,
  verified: true, trustScore: true, amenities: true, aiBadges: true,
  createdAt: true, featuredUntil: true, boostedUntil: true,
};

export async function getLatestProperties(limit = 8): Promise<Property[]> {
  if (USE_DB()) {
    try {
      const { prisma } = await import("@/server/db");
      const rows = await prisma.property.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: SELECT,
      });
      if (rows.length > 0) return rows.map(rowToProperty);
    } catch {
      // fall through
    }
  }
  return [...MOCK_PROPERTIES]
    .sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt))
    .slice(0, limit);
}

export async function getSponsoredProperties(limit = 8): Promise<Property[]> {
  if (USE_DB()) {
    try {
      const { prisma } = await import("@/server/db");
      const now = new Date();
      const rows = await prisma.property.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { featuredUntil: { gt: now } },
            { boostedUntil:  { gt: now } },
          ],
        },
        orderBy: [{ featuredUntil: "desc" }, { boostedUntil: "desc" }],
        take: limit,
        select: SELECT,
      });
      if (rows.length > 0) return rows.map(rowToProperty);
    } catch {
      // fall through
    }
  }
  // Mock fallback — surface verified + high trust as "sponsored-feel".
  return MOCK_PROPERTIES
    .filter((p) => p.verified && p.trustScore >= 75)
    .slice(0, limit);
}

export async function getBestDeals(limit = 8): Promise<Property[]> {
  if (USE_DB()) {
    try {
      const { prisma } = await import("@/server/db");
      const rows = await prisma.property.findMany({
        where: {
          status: "ACTIVE",
          previousPriceInr: { gt: 0 },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 3,
        select: SELECT,
      });
      // Keep only the ones that are actually cheaper than before.
      const drops = rows.filter((r) => r.previousPriceInr! > r.priceInr).slice(0, limit);
      if (drops.length > 0) return drops.map(rowToProperty);
    } catch {
      // fall through
    }
  }
  return MOCK_PROPERTIES
    .filter((p) => p.badges?.includes("price-dropped") || (p.previousPriceInr && p.previousPriceInr > p.priceInr))
    .slice(0, limit);
}
