import type { Property } from "./types";

export interface ViralSignal {
  id: "hot-nearby" | "only-n-left" | "trending" | "price-dropped" | "newly-listed";
  label: string;
  tone: "rose" | "amber" | "violet" | "emerald" | "sky";
  weight: number; // higher = more attention-grabbing
}

const HOURS = 60 * 60 * 1000;

/**
 * Deterministic viral signal derived from a property — no network.
 * One property can return multiple signals (sorted by weight desc).
 */
export function viralSignalsFor(p: Property): ViralSignal[] {
  const out: ViralSignal[] = [];
  const ageMs = Date.now() - new Date(p.postedAt).getTime();

  if (p.previousPriceInr && p.previousPriceInr > p.priceInr) {
    const drop = ((p.previousPriceInr - p.priceInr) / p.previousPriceInr) * 100;
    out.push({
      id: "price-dropped",
      label: `Price dropped ${drop.toFixed(0)}%`,
      tone: "rose",
      weight: 90,
    });
  }
  if (ageMs < 24 * HOURS) {
    out.push({ id: "newly-listed", label: "New listing", tone: "sky", weight: 60 });
  }
  if (p.trustScore >= 90) {
    out.push({ id: "trending", label: "Trending in area", tone: "violet", weight: 70 });
  }
  // Pseudo-stock from id hash → makes "Only N left" stable per property.
  const hash = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (hash % 5 === 0) {
    out.push({ id: "only-n-left", label: `Only ${(hash % 3) + 1} left`, tone: "amber", weight: 85 });
  } else if (hash % 4 === 0) {
    out.push({ id: "hot-nearby", label: "Hot nearby", tone: "rose", weight: 80 });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

/** Pick the top signal — what the card surfaces in the corner. */
export function topViralSignal(p: Property): ViralSignal | undefined {
  return viralSignalsFor(p)[0];
}
