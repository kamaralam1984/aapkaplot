/**
 * Shared props for every programmatic-SEO template variant.
 * Each template renders the same ComposedPage data with a wholly
 * different visual layout (per [[seo-content-rules]]).
 */
import type { ComposedPage } from "@/lib/seo/content-composer";
import type { GeoEntry, PropertyKindSlug, PropertyIntentSlug } from "@/lib/seo/geo-dataset";

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
}
