/**
 * Template router — picks one of 6 visually-distinct templates by
 * deterministic hash of the slug. Same URL → same template forever;
 * spread across all generated pages so adjacent listings don't look
 * cookie-cutter.
 *
 * Per [[seo-content-rules]], every page must NOT look like the page
 * before it. The router is the enforcement point.
 */

export type TemplateVariant =
  | "overview-map"        // hero map + listings grid (default for cities)
  | "buying-guide"        // article-style, long-form with TOC
  | "price-dashboard"     // data-forward, charts & stats
  | "comparison"          // split-view, two-column "this vs that"
  | "investment-outlook"  // narrative + projections, FAQ-led
  | "knowledge-faq";      // FAQ-first, learn-then-browse

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  "overview-map",
  "buying-guide",
  "price-dashboard",
  "comparison",
  "investment-outlook",
  "knowledge-faq",
];

/** Hash a slug to a stable 32-bit int. */
function hash(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick a template variant for a slug.
 *
 * Distribution is not uniform random — we weight `overview-map` slightly
 * heavier (it's the most useful default for city/locality pages) and
 * `comparison` slightly lighter (only meaningful when there is a logical
 * sibling to compare against).
 */
export function pickTemplate(slug: string): TemplateVariant {
  const h = hash(slug);
  const bucket = h % 100;
  if (bucket < 25) return "overview-map";
  if (bucket < 42) return "buying-guide";
  if (bucket < 59) return "price-dashboard";
  if (bucket < 70) return "comparison";
  if (bucket < 85) return "investment-outlook";
  return "knowledge-faq";
}
