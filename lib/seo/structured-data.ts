/**
 * JSON-LD structured-data builder. Picks schema type by template variant
 * so each page surfaces the richest possible search-result enhancements
 * (FAQ rich result, breadcrumb, Place card, RealEstateListing).
 */
import type { ComposedPage } from "./content-composer";
import type { GeoEntry, PropertyKindSlug, PropertyIntentSlug } from "./geo-dataset";
import type { TemplateVariant } from "./template-router";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://aapkaplot.com";

interface JsonLdNode {
  "@context"?: string;
  "@graph"?: unknown[];
  "@type"?: string | string[];
  [k: string]: unknown;
}

export function buildJsonLd(args: {
  page: ComposedPage;
  geo: GeoEntry;
  parentGeo?: GeoEntry;
  kind: PropertyKindSlug;
  intent: PropertyIntentSlug;
  variant: TemplateVariant;
  canonicalPath: string;
}): JsonLdNode {
  const { page, geo, parentGeo, variant, canonicalPath } = args;
  const url = `${SITE}${canonicalPath}`;

  const graph: unknown[] = [];

  // BreadcrumbList — always
  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AapKaPlot", item: SITE },
      ...(parentGeo
        ? [{ "@type": "ListItem", position: 2, name: parentGeo.name, item: `${SITE}/in/${parentGeo.slug}` }]
        : []),
      { "@type": "ListItem", position: parentGeo ? 3 : 2, name: geo.name, item: url },
    ],
  });

  // WebPage
  graph.push({
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.metaDescription,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${SITE}#website` },
    keywords: page.keywords.join(", "),
  });

  // Place (geographic entity)
  graph.push({
    "@type": "Place",
    name: geo.name,
    geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng },
    containedInPlace: parentGeo
      ? { "@type": "Place", name: parentGeo.name }
      : geo.state
        ? { "@type": "AdministrativeArea", name: geo.state.replace(/-/g, " ") }
        : undefined,
  });

  // FAQPage when template emphasises FAQ
  const faqBlock = page.blocks.find((b) => b.kind === "faq");
  const faqs = (faqBlock?.data?.faqs as { q: string; a: string }[] | undefined) ?? [];
  if (faqs.length && (variant === "knowledge-faq" || variant === "buying-guide" || variant === "investment-outlook")) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  // Article when long-form
  if (variant === "buying-guide" || variant === "investment-outlook") {
    graph.push({
      "@type": "Article",
      headline: page.h1,
      description: page.metaDescription,
      author: { "@type": "Organization", name: "AapKaPlot" },
      publisher: { "@type": "Organization", name: "AapKaPlot", url: SITE },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      datePublished: new Date().toISOString().slice(0, 10),
      keywords: page.keywords.join(", "),
      wordCount: page.wordCount,
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
