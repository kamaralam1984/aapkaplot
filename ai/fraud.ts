import type { Property } from "@/lib/types";

export type FraudReason =
  | "duplicate-image"
  | "duplicate-listing"
  | "price-anomaly"
  | "suspicious-title"
  | "low-trust";

export interface FraudFlag {
  propertyId: string;
  severity: "low" | "medium" | "high";
  reasons: { id: FraudReason; detail: string }[];
  score: number; // 0..100, higher is worse
}

const SUSPICIOUS = /(?:loan|crypto|jackpot|forex|lottery|free)/i;

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function stddev(nums: number[]): number {
  if (!nums.length) return 1;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(v) || 1;
}

/** Strip URL query params + take last 2 path segments. Acts as a lightweight perceptual key. */
function imageKey(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.slice(-2).join("/").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Run a deterministic, no-network fraud scan over the property catalogue.
 * Production: replace `imageKey` with a real perceptual hash (pHash) and
 * compute z-score per micro-market instead of per-kind.
 */
export function scanForFraud(properties: Property[]): FraudFlag[] {
  // Group by kind so price-per-sqft anomalies are kind-relative.
  const byKind = new Map<string, Property[]>();
  for (const p of properties) {
    const list = byKind.get(p.kind) ?? [];
    list.push(p);
    byKind.set(p.kind, list);
  }

  const kindStats = new Map<string, { med: number; sd: number }>();
  for (const [kind, list] of byKind) {
    const psfs = list.map((p) => p.priceInr / Math.max(1, p.areaSqft));
    kindStats.set(kind, { med: median(psfs), sd: stddev(psfs) });
  }

  // Build inverted indexes for dedupe detection.
  const imageHits = new Map<string, string[]>();
  const titleLocalityHits = new Map<string, string[]>();
  for (const p of properties) {
    const ik = imageKey(p.media.cover);
    const list = imageHits.get(ik) ?? [];
    list.push(p.id);
    imageHits.set(ik, list);

    const tk = `${p.title.toLowerCase().trim()}|${p.location.locality.toLowerCase().trim()}`;
    const tList = titleLocalityHits.get(tk) ?? [];
    tList.push(p.id);
    titleLocalityHits.set(tk, tList);
  }

  const flags: FraudFlag[] = [];

  for (const p of properties) {
    const reasons: FraudFlag["reasons"] = [];
    let score = 0;

    // 1. Duplicate cover image across listings
    const sameImage = imageHits.get(imageKey(p.media.cover)) ?? [];
    if (sameImage.length > 1) {
      reasons.push({
        id: "duplicate-image",
        detail: `Cover image shared with ${sameImage.length - 1} other listing(s)`,
      });
      score += 18 + Math.min(12, (sameImage.length - 1) * 3);
    }

    // 2. Duplicate listing (same title + locality)
    const tk = `${p.title.toLowerCase().trim()}|${p.location.locality.toLowerCase().trim()}`;
    const sameTitle = titleLocalityHits.get(tk) ?? [];
    if (sameTitle.length > 2) {
      reasons.push({
        id: "duplicate-listing",
        detail: `${sameTitle.length} listings share this title in ${p.location.locality}`,
      });
      score += 20;
    }

    // 3. Price anomaly (z-score over kind-pricing)
    const psf = p.priceInr / Math.max(1, p.areaSqft);
    const stats = kindStats.get(p.kind);
    if (stats && stats.sd > 0) {
      const z = (psf - stats.med) / stats.sd;
      if (Math.abs(z) >= 2) {
        reasons.push({
          id: "price-anomaly",
          detail: z > 0
            ? `Priced ${z.toFixed(1)}σ above ${p.kind} median (₹${stats.med.toFixed(0)}/sqft)`
            : `Priced ${Math.abs(z).toFixed(1)}σ below ${p.kind} median (₹${stats.med.toFixed(0)}/sqft)`,
        });
        score += Math.min(35, Math.abs(z) * 10);
      }
    }

    // 4. Suspicious keywords in title
    if (SUSPICIOUS.test(p.title)) {
      reasons.push({
        id: "suspicious-title",
        detail: "Title contains a high-risk keyword (loan / crypto / lottery / free)",
      });
      score += 25;
    }

    // 5. Very low trust + unverified
    if (!p.verified && p.trustScore < 70) {
      reasons.push({
        id: "low-trust",
        detail: `Unverified owner with trust score ${p.trustScore}`,
      });
      score += 10;
    }

    if (reasons.length === 0) continue;
    const severity: FraudFlag["severity"] = score >= 50 ? "high" : score >= 25 ? "medium" : "low";
    flags.push({ propertyId: p.id, severity, reasons, score: Math.min(100, Math.round(score)) });
  }

  return flags.sort((a, b) => b.score - a.score);
}
