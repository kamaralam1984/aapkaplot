/**
 * Server-side fraud scanner — runs against the live Postgres catalogue.
 *
 * Reuses the deterministic heuristics from `@/ai/fraud` (no API calls) but
 * adds locality-level price z-score so a 30 L flat in a 1.5 cr locality
 * surfaces immediately. Free, no extra deps.
 */
import { prisma } from "@/server/db";
import { scanForFraud, type FraudFlag } from "@/ai/fraud";
import type { Property as PublicProperty } from "@/lib/types";

const KIND_TO_LOWER: Record<string, PublicProperty["kind"]> = {
  PLOT: "plot",
  FLAT: "flat",
  HOUSE: "house",
  VILLA: "villa",
  SHOP: "shop",
  OFFICE: "office",
  WAREHOUSE: "warehouse",
  AGRICULTURE: "agriculture",
};

const INTENT_TO_LOWER: Record<string, PublicProperty["intent"]> = {
  BUY: "buy",
  RENT: "rent",
  SELL: "sell",
};

/**
 * Compute fraud flags for all ACTIVE/PENDING listings. Includes a
 * locality-aware price z-score as an extra signal — anything ≥3σ above
 * the local median is bumped to high-severity.
 */
export async function scanDbForFraud(): Promise<FraudFlag[]> {
  const rows = await prisma.property.findMany({
    where: { status: { in: ["ACTIVE", "PENDING_REVIEW"] } },
    take: 500,
    select: {
      id: true, title: true, description: true, kind: true, intent: true,
      priceInr: true, previousPriceInr: true, areaSqft: true, bhk: true,
      locality: true, city: true, state: true, lat: true, lng: true,
      coverUrl: true, gallery: true, verified: true, trustScore: true,
      amenities: true, aiBadges: true, createdAt: true,
    },
  });

  // Map DB rows -> public Property shape so we can reuse scanForFraud.
  const properties: PublicProperty[] = rows.map((r) => ({
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
    },
    verified: r.verified,
    trustScore: r.trustScore,
    postedAt: r.createdAt.toISOString(),
    badges: r.aiBadges as PublicProperty["badges"],
    amenities: r.amenities as PublicProperty["amenities"],
  }));

  const base = scanForFraud(properties);

  // Augment with locality z-score on price-per-sqft.
  const byLocality = new Map<string, number[]>();
  for (const p of properties) {
    const k = `${p.location.city}|${p.location.locality}`.toLowerCase();
    const psf = p.priceInr / Math.max(1, p.areaSqft);
    const list = byLocality.get(k) ?? [];
    list.push(psf);
    byLocality.set(k, list);
  }

  const localityStats = new Map<string, { mean: number; sd: number }>();
  for (const [k, vals] of byLocality) {
    if (vals.length < 3) continue;          // need ≥3 samples for a usable σ
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(
      vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length
    ) || 1;
    localityStats.set(k, { mean, sd });
  }

  const flagsById = new Map(base.map((f) => [f.propertyId, f]));

  for (const p of properties) {
    const k = `${p.location.city}|${p.location.locality}`.toLowerCase();
    const stats = localityStats.get(k);
    if (!stats) continue;
    const psf = p.priceInr / Math.max(1, p.areaSqft);
    const z = (psf - stats.mean) / stats.sd;
    if (Math.abs(z) < 3) continue;

    const existing = flagsById.get(p.id) ?? {
      propertyId: p.id,
      severity: "low" as const,
      reasons: [] as FraudFlag["reasons"],
      score: 0,
    };
    existing.reasons.push({
      id: "price-anomaly",
      detail: `Price/sqft ${z > 0 ? "+" : ""}${z.toFixed(1)}σ vs locality median`,
    });
    existing.score = Math.min(100, existing.score + Math.min(40, Math.abs(z) * 8));
    if (existing.score >= 50) existing.severity = "high";
    else if (existing.score >= 25) existing.severity = "medium";
    flagsById.set(p.id, existing);
  }

  return Array.from(flagsById.values()).sort((a, b) => b.score - a.score);
}
