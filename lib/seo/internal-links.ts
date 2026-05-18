/**
 * Internal linking — each page links to 5-10 semantically related pages.
 *
 * Semantic relations (in priority order):
 *   1. Same locality, different kind  (Plots in Boring Road → Flats in Boring Road)
 *   2. Same city, different locality   (Boring Road → Kankarbagh)
 *   3. Same state, different city      (Patna → Gaya)
 *   4. Same kind, different intent     (Buy → Rent)
 *
 * Per [[seo-content-rules]] internal linking is part of the page quality
 * signal — pages that are well-connected rank better than orphans.
 */

import { PROPERTY_KINDS, ALL_GEO } from "./geo-dataset";
import type { GeoEntry, PropertyKindSlug, PropertyIntentSlug } from "./geo-dataset";
import { KIND_PHRASES } from "./keyword-bank";

export interface RelatedLink {
  label: string;
  href: string;
  kind: "same-locality-diff-kind" | "same-city-diff-locality" | "same-state-diff-city" | "kind-cross-intent";
}

function seoHref(geo: GeoEntry, kind: PropertyKindSlug, intent: PropertyIntentSlug): string {
  return `/seo/${intent}-${kind}/${geo.slug}`;
}

export function buildRelatedLinks(
  geo: GeoEntry,
  parentGeo: GeoEntry | undefined,
  kind: PropertyKindSlug,
  intent: PropertyIntentSlug,
  limit = 10,
): RelatedLink[] {
  const links: RelatedLink[] = [];

  // 1. Same place, different property kind
  for (const k of PROPERTY_KINDS) {
    if (k.slug === kind) continue;
    links.push({
      label: `${k.plural} in ${geo.name}`,
      href: seoHref(geo, k.slug, intent),
      kind: "same-locality-diff-kind",
    });
    if (links.length >= 3) break;
  }

  // 2. Same city, different localities (only if we're on a locality page)
  if (parentGeo) {
    const siblings = ALL_GEO.filter(
      (g) => g.parent === parentGeo.slug && g.slug !== geo.slug,
    ).slice(0, 4);
    for (const s of siblings) {
      links.push({
        label: `${KIND_PHRASES[kind].plural} in ${s.name}`,
        href: seoHref(s, kind, intent),
        kind: "same-city-diff-locality",
      });
    }
  }

  // 3. Same state, different cities
  if (geo.state) {
    const stateSiblings = ALL_GEO.filter(
      (g) => g.state === geo.state && g.tier !== "locality" && g.slug !== geo.slug,
    ).slice(0, 3);
    for (const s of stateSiblings) {
      links.push({
        label: `${KIND_PHRASES[kind].plural} in ${s.name}`,
        href: seoHref(s, kind, intent),
        kind: "same-state-diff-city",
      });
    }
  }

  // 4. Cross-intent on same place (Buy ↔ Rent)
  const crossIntent = intent === "buy" ? "rent" : "buy";
  links.push({
    label: `${KIND_PHRASES[kind].plural} for ${crossIntent} in ${geo.name}`,
    href: seoHref(geo, kind, crossIntent),
    kind: "kind-cross-intent",
  });

  return links.slice(0, limit);
}
