/**
 * Shared props for every programmatic-SEO template variant.
 * Each template renders the same ComposedPage data with a wholly
 * different visual layout (per [[seo-content-rules]]).
 *
 * The `theme` prop carries the per-page colour scheme + hero style picked
 * deterministically from the slug hash — so neighbouring pages share a
 * template variant but never look identical.
 */
import type { ComposedPage } from "@/lib/seo/content-composer";
import type { GeoEntry, PropertyKindSlug, PropertyIntentSlug } from "@/lib/seo/geo-dataset";
import type { PageTheme } from "@/lib/seo/page-theme";

export interface SeoTemplateProps {
  page: ComposedPage;
  geo: GeoEntry;
  parentGeo?: GeoEntry;
  kind: PropertyKindSlug;
  intent: PropertyIntentSlug;
  /** Pre-rendered internal links (semantic siblings) */
  relatedLinks: { label: string; href: string }[];
  /** Pre-rendered actual listing cards from DB (markup not raw HTML) */
  listingsSlot?: React.ReactNode;
  /** Slug used by template-router to pick the variant — also seed for theme. */
  slug: string;
  /** Per-page visual theme (colours + hero style). */
  theme: PageTheme;
}
