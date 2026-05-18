/**
 * Daily SEO-page generator. Picks up to MAX_PER_RUN combinations that
 * haven't been built yet (or are stale beyond REFRESH_AFTER_DAYS),
 * enriches with free data sources, composes content, runs the quality
 * gate, and persists to the SeoPage table.
 *
 * Per [[seo-content-rules]] this is hard-capped at 100/day.
 */

import { prisma } from "@/server/db";
import {
  ALL_GEO, PATNA_LOCALITIES, BIHAR_DISTRICTS, INDIA_CITIES, WORLD_CITIES,
  PROPERTY_KINDS, PROPERTY_INTENTS, GEO_BY_SLUG,
} from "./geo-dataset";
import type { GeoEntry, PropertyKindSlug, PropertyIntentSlug } from "./geo-dataset";
import { fetchWikiSummary, fetchNearbyPoi, fetchListingStats } from "./data-sources";
import { composePage } from "./content-composer";
import { gradePage } from "./quality-gate";
import { pickTemplate } from "./template-router";

export const MAX_PER_RUN = 100;
const REFRESH_AFTER_DAYS = 30;

const PRISMA_TEMPLATE_TO_VARIANT: Record<string, "overview-map" | "buying-guide" | "price-dashboard" | "comparison" | "investment-outlook" | "knowledge-faq"> = {
  OVERVIEW_MAP: "overview-map",
  BUYING_GUIDE: "buying-guide",
  PRICE_DASHBOARD: "price-dashboard",
  COMPARISON: "comparison",
  INVESTMENT_OUTLOOK: "investment-outlook",
  KNOWLEDGE_FAQ: "knowledge-faq",
};

const TEMPLATE_TO_ENUM: Record<string, "OVERVIEW_MAP" | "BUYING_GUIDE" | "PRICE_DASHBOARD" | "COMPARISON" | "INVESTMENT_OUTLOOK" | "KNOWLEDGE_FAQ"> = {
  "overview-map": "OVERVIEW_MAP",
  "buying-guide": "BUYING_GUIDE",
  "price-dashboard": "PRICE_DASHBOARD",
  "comparison": "COMPARISON",
  "investment-outlook": "INVESTMENT_OUTLOOK",
  "knowledge-faq": "KNOWLEDGE_FAQ",
};

/**
 * Priority-ordered geo list. Earlier entries are generated first when
 * we have not yet covered the full space.
 */
function priorityGeos(): GeoEntry[] {
  return [
    ...PATNA_LOCALITIES,
    ...BIHAR_DISTRICTS,
    ...INDIA_CITIES,
    ...WORLD_CITIES,
  ];
}

function makeSlug(intent: PropertyIntentSlug, kind: PropertyKindSlug, geo: GeoEntry): string {
  return `${intent}-${kind}/${geo.slug}`;
}

export interface GenerationResult {
  attempted: number;
  published: number;
  rejected: number;
  skipped: number;
  durationMs: number;
  rejections: { slug: string; score: number; reasons: string[] }[];
  publishedSlugs: string[];
}

export async function runGeneration(limit = MAX_PER_RUN): Promise<GenerationResult> {
  const start = Date.now();
  const result: GenerationResult = {
    attempted: 0, published: 0, rejected: 0, skipped: 0,
    durationMs: 0, rejections: [], publishedSlugs: [],
  };

  // Existing slugs we should skip (or refresh if stale).
  const existing = await prisma.seoPage.findMany({
    select: { slug: true, lastBuiltAt: true, status: true },
  });
  type ExistingRow = { slug: string; lastBuiltAt: Date; status: string };
  const existingMap = new Map<string, ExistingRow>(
    existing.map((e: ExistingRow) => [e.slug, e]),
  );
  const staleCutoff = new Date(Date.now() - REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const candidates: { geo: GeoEntry; kind: PropertyKindSlug; intent: PropertyIntentSlug; slug: string }[] = [];

  for (const geo of priorityGeos()) {
    for (const kind of PROPERTY_KINDS) {
      for (const intent of PROPERTY_INTENTS) {
        const slug = makeSlug(intent.slug, kind.slug, geo);
        const ex = existingMap.get(slug);
        if (!ex) {
          candidates.push({ geo, kind: kind.slug, intent: intent.slug, slug });
        } else if (ex.lastBuiltAt < staleCutoff) {
          // stale refresh — push at the end so fresh pages are prioritised
          candidates.push({ geo, kind: kind.slug, intent: intent.slug, slug });
        }
        if (candidates.length >= limit * 3) break; // gather enough; we'll cap inside the loop
      }
      if (candidates.length >= limit * 3) break;
    }
    if (candidates.length >= limit * 3) break;
  }

  for (const c of candidates) {
    if (result.published >= limit) break;
    result.attempted++;
    try {
      const parentGeo = c.geo.parent ? GEO_BY_SLUG.get(c.geo.parent) : undefined;
      const placeForOsmWiki = c.geo.tier === "locality" && parentGeo
        ? `${c.geo.name}, ${parentGeo.name}`
        : c.geo.name;

      const [wiki, poi, stats] = await Promise.all([
        fetchWikiSummary(placeForOsmWiki),
        fetchNearbyPoi(c.geo.lat, c.geo.lng),
        fetchListingStats(prisma, parentGeo?.name ?? c.geo.name, parentGeo ? c.geo.name : undefined),
      ]);

      const composed = composePage({
        geo: c.geo,
        parentGeo,
        kind: c.kind,
        intent: c.intent,
        wiki,
        poi,
        stats,
        slug: c.slug,
      });

      const grade = gradePage(composed);
      const variant = pickTemplate(c.slug);

      if (!grade.passes) {
        result.rejected++;
        result.rejections.push({ slug: c.slug, score: grade.score, reasons: grade.reasons });
        // Persist as REJECTED for diagnostics — but only if we have not
        // previously published it (don't downgrade a passing page).
        const ex = existingMap.get(c.slug);
        if (!ex || ex.status === "REJECTED") {
          await prisma.seoPage.upsert({
            where: { slug: c.slug },
            create: {
              slug: c.slug,
              intent: c.intent,
              kind: c.kind,
              geoSlug: c.geo.slug,
              parentGeoSlug: c.geo.parent ?? null,
              template: TEMPLATE_TO_ENUM[variant],
              status: "REJECTED",
              title: composed.title,
              metaDescription: composed.metaDescription,
              h1: composed.h1,
              content: JSON.parse(JSON.stringify(composed)),
              qualityScore: grade.score,
              wordCount: composed.wordCount,
              sources: composed.sources,
              keywords: composed.keywords,
              lastBuiltAt: new Date(),
            },
            update: {
              qualityScore: grade.score,
              wordCount: composed.wordCount,
              lastBuiltAt: new Date(),
              status: "REJECTED",
            },
          });
        }
        continue;
      }

      const publishedAt = existingMap.get(c.slug)?.status === "PUBLISHED"
        ? undefined  // keep original publishedAt on refresh
        : new Date();

      await prisma.seoPage.upsert({
        where: { slug: c.slug },
        create: {
          slug: c.slug,
          intent: c.intent,
          kind: c.kind,
          geoSlug: c.geo.slug,
          parentGeoSlug: c.geo.parent ?? null,
          template: TEMPLATE_TO_ENUM[variant],
          status: "PUBLISHED",
          title: composed.title,
          metaDescription: composed.metaDescription,
          h1: composed.h1,
          content: JSON.parse(JSON.stringify(composed)),
          qualityScore: grade.score,
          wordCount: composed.wordCount,
          sources: composed.sources,
          keywords: composed.keywords,
          publishedAt: new Date(),
          lastBuiltAt: new Date(),
        },
        update: {
          template: TEMPLATE_TO_ENUM[variant],
          status: "PUBLISHED",
          title: composed.title,
          metaDescription: composed.metaDescription,
          h1: composed.h1,
          content: JSON.parse(JSON.stringify(composed)),
          qualityScore: grade.score,
          wordCount: composed.wordCount,
          sources: composed.sources,
          keywords: composed.keywords,
          lastBuiltAt: new Date(),
          ...(publishedAt ? { publishedAt } : {}),
        },
      });

      result.published++;
      result.publishedSlugs.push(c.slug);
    } catch (err) {
      result.skipped++;
      console.error(`[seo-generator] ${c.slug} failed`, err);
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ─────────────────────────────────────────────────────────────
// Single-page operations (used by admin actions)
// ─────────────────────────────────────────────────────────────

export interface SingleRebuildResult {
  ok: boolean;
  published: boolean;
  score: number;
  wordCount: number;
  reasons: string[];
}

/** Rebuild a single SeoPage in-place — re-fetches all sources, recomposes,
 *  re-grades, and persists. Returns whether it passed the quality gate. */
export async function rebuildSinglePage(seoPageId: string): Promise<SingleRebuildResult> {
  const row = await prisma.seoPage.findUnique({ where: { id: seoPageId } });
  if (!row) {
    return { ok: false, published: false, score: 0, wordCount: 0, reasons: ["not found"] };
  }

  const geo = GEO_BY_SLUG.get(row.geoSlug);
  if (!geo) {
    return { ok: false, published: false, score: 0, wordCount: 0, reasons: ["geo slug not in dataset"] };
  }
  const parentGeo = row.parentGeoSlug ? GEO_BY_SLUG.get(row.parentGeoSlug) : undefined;

  const placeForOsmWiki = geo.tier === "locality" && parentGeo
    ? `${geo.name}, ${parentGeo.name}`
    : geo.name;

  const [wiki, poi, stats] = await Promise.all([
    fetchWikiSummary(placeForOsmWiki),
    fetchNearbyPoi(geo.lat, geo.lng),
    fetchListingStats(prisma, parentGeo?.name ?? geo.name, parentGeo ? geo.name : undefined),
  ]);

  const composed = composePage({
    geo,
    parentGeo,
    kind: row.kind as Parameters<typeof composePage>[0]["kind"],
    intent: row.intent as Parameters<typeof composePage>[0]["intent"],
    wiki,
    poi,
    stats,
    slug: row.slug,
  });

  const grade = gradePage(composed);
  const variant = pickTemplate(row.slug);
  const passes = grade.passes;

  await prisma.seoPage.update({
    where: { id: seoPageId },
    data: {
      template: TEMPLATE_TO_ENUM[variant],
      status: passes ? "PUBLISHED" : "REJECTED",
      title: composed.title,
      metaDescription: composed.metaDescription,
      h1: composed.h1,
      content: JSON.parse(JSON.stringify(composed)),
      qualityScore: grade.score,
      wordCount: composed.wordCount,
      sources: composed.sources,
      keywords: composed.keywords,
      lastBuiltAt: new Date(),
      ...(passes && row.status !== "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  return {
    ok: true,
    published: passes,
    score: grade.score,
    wordCount: composed.wordCount,
    reasons: grade.reasons,
  };
}

/** Try harder: rebuild with up to 3 internal retries (no behavioural diff right
 *  now — composer is deterministic — but provides a future hook for "shuffle
 *  variation seed" without breaking page URLs). Returns final attempt result.
 *  Use [[PRISMA_TEMPLATE_TO_VARIANT]] when surfacing the active template. */
export async function improveSinglePage(seoPageId: string, maxAttempts = 3): Promise<SingleRebuildResult> {
  let last: SingleRebuildResult = { ok: false, published: false, score: 0, wordCount: 0, reasons: ["no attempts"] };
  for (let i = 0; i < maxAttempts; i++) {
    last = await rebuildSinglePage(seoPageId);
    if (last.published) return last;
  }
  return last;
}

export { PRISMA_TEMPLATE_TO_VARIANT };

