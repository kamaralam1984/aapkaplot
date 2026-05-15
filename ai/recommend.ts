import type { Property, GeoPoint, AIBadge } from "@/lib/types";
import { haversineKm } from "@/lib/haversine";

/**
 * Light-weight, deterministic ranking that mixes proximity, trust score,
 * price competitiveness and freshness. This is the offline baseline — a
 * production deployment can layer a learned model on top of these scores.
 */
export interface RecommendInput {
  origin: GeoPoint;
  pool: Property[];
  preferKind?: Property["kind"];
  budget?: { min?: number; max?: number };
  limit?: number;
}

interface ScoredProperty extends Property {
  score: number;
  signals: Partial<Record<AIBadge, true>>;
}

export function rankRecommendations({
  origin,
  pool,
  preferKind,
  budget,
  limit = 12,
}: RecommendInput): ScoredProperty[] {
  const now = Date.now();
  const medianPrice = median(pool.map((p) => p.priceInr));

  return pool
    .map<ScoredProperty>((p) => {
      const distanceKm = haversineKm(origin, p.location.coords);
      const proximity = Math.max(0, 1 - Math.min(distanceKm, 25) / 25); // 0..1, full credit at 0km
      const trust = p.trustScore / 100;
      const priceEdge = medianPrice ? Math.max(0, 1 - p.priceInr / medianPrice) : 0;
      const fresh = freshness(now - new Date(p.postedAt).getTime());
      const kindBoost = preferKind && p.kind === preferKind ? 0.15 : 0;
      const budgetFit = matchBudget(p.priceInr, budget) ? 0.1 : 0;

      const score =
        proximity * 0.45 +
        trust * 0.2 +
        fresh * 0.1 +
        priceEdge * 0.1 +
        kindBoost +
        budgetFit;

      const signals: ScoredProperty["signals"] = {};
      if (distanceKm <= 3) signals["near-you"] = true;
      if (p.previousPriceInr && p.previousPriceInr > p.priceInr)
        signals["price-dropped"] = true;
      if (priceEdge > 0.25) signals["best-investment"] = true;
      if (trust > 0.85 && fresh > 0.7) signals["high-demand"] = true;

      return { ...p, distanceKm, score, signals };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

function freshness(ageMs: number): number {
  const days = ageMs / (24 * 60 * 60 * 1000);
  return Math.max(0, 1 - days / 30); // 1.0 fresh, 0 after a month
}

function matchBudget(price: number, budget?: { min?: number; max?: number }) {
  if (!budget) return false;
  if (typeof budget.min === "number" && price < budget.min) return false;
  if (typeof budget.max === "number" && price > budget.max) return false;
  return true;
}
