/** Helpers for broker profile slug + commission math. */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Compute expected commission in ₹ given listing price + pct.
 * Returns rounded integer (no decimals — INR is an integer currency for our purposes).
 */
export function expectedCommission(priceInr: number, commissionPct: number): number {
  return Math.round((priceInr * commissionPct) / 100);
}
