import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { GEO_BY_SLUG, KIND_TO_PRISMA, INTENT_TO_PRISMA } from "@/lib/seo/geo-dataset";
import type { PropertyKindSlug, PropertyIntentSlug } from "@/lib/seo/geo-dataset";
import { buildRelatedLinks } from "@/lib/seo/internal-links";
import { buildJsonLd } from "@/lib/seo/structured-data";
import { RenderSeoTemplate } from "@/components/seo/templates";
import type { TemplateVariant } from "@/lib/seo/template-router";
import type { ComposedPage } from "@/lib/seo/content-composer";

export const revalidate = 3600; // 1 hour ISR; cron rebuilds the underlying SeoPage

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

// SeoTemplate enum value → TemplateVariant slug
const VARIANT_MAP: Record<string, TemplateVariant> = {
  OVERVIEW_MAP: "overview-map",
  BUYING_GUIDE: "buying-guide",
  PRICE_DASHBOARD: "price-dashboard",
  COMPARISON: "comparison",
  INVESTMENT_OUTLOOK: "investment-outlook",
  KNOWLEDGE_FAQ: "knowledge-faq",
};

/** Parse the URL segments to a database slug.
 *  /seo/buy-plot/boring-road  →  "buy-plot/boring-road" */
function toDbSlug(segments: string[]): string | null {
  if (segments.length !== 2) return null;
  const [intentKind, geoSlug] = segments;
  if (!intentKind.includes("-")) return null;
  return `${intentKind}/${geoSlug}`;
}

async function loadPage(segments: string[]) {
  const dbSlug = toDbSlug(segments);
  if (!dbSlug) return null;
  const row = await prisma.seoPage.findUnique({
    where: { slug: dbSlug },
  });
  if (!row || row.status !== "PUBLISHED") return null;
  return row;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const row = await loadPage(slug);
  if (!row) return { title: "Page not found" };
  const canonical = `/seo/${slug.join("/")}`;
  return {
    title: row.title,
    description: row.metaDescription,
    keywords: row.keywords,
    alternates: { canonical },
    openGraph: { title: row.title, description: row.metaDescription, type: "website" },
    robots: { index: true, follow: true },
  };
}

interface ListingRow {
  id: string;
  title: string;
  priceInr: number;
  areaSqft: number;
  city: string;
  locality: string;
  coverUrl: string;
}

async function fetchLiveListings(geoName: string, kind: PropertyKindSlug, intent: PropertyIntentSlug): Promise<ListingRow[]> {
  const intentEnum = INTENT_TO_PRISMA[intent];
  const kindEnum = KIND_TO_PRISMA[kind];
  return prisma.property.findMany({
    where: {
      status: "ACTIVE",
      kind: kindEnum,
      intent: intentEnum,
      OR: [
        { city: { equals: geoName, mode: "insensitive" } },
        { locality: { equals: geoName, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, priceInr: true, areaSqft: true, city: true, locality: true, coverUrl: true },
    take: 12,
    orderBy: { createdAt: "desc" },
  });
}

function ListingsSlot({ listings }: { listings: ListingRow[] }) {
  if (!listings.length) {
    return (
      <p className="text-sm text-ink-600 italic">
        No active listings here yet — set up a notification below to be the first to know when one goes live.
      </p>
    );
  }
  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {listings.map((p) => (
        <li key={p.id} className="rounded-xl ring-1 ring-black/5 bg-white overflow-hidden hover:shadow-md transition">
          <Link href={`/property/${p.id}`} className="flex">
            {p.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverUrl} alt="" className="w-24 h-24 object-cover" />
            )}
            <div className="p-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 line-clamp-2">{p.title}</p>
              <p className="mt-1 text-xs text-ink-500">{p.locality}, {p.city}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">₹{Math.round(p.priceInr / 100_000)} L</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function SeoPage({ params }: RouteParams) {
  const { slug } = await params;
  const row = await loadPage(slug);
  if (!row) notFound();

  const geo = GEO_BY_SLUG.get(row.geoSlug);
  if (!geo) notFound();
  const parentGeo = row.parentGeoSlug ? GEO_BY_SLUG.get(row.parentGeoSlug) : undefined;

  const intent = row.intent as PropertyIntentSlug;
  const kind = row.kind as PropertyKindSlug;
  const variant = VARIANT_MAP[row.template] ?? "overview-map";
  const content = row.content as unknown as ComposedPage;

  const [listings, related] = await Promise.all([
    fetchLiveListings(geo.name, kind, intent),
    Promise.resolve(buildRelatedLinks(geo, parentGeo, kind, intent, 8)),
  ]);

  const jsonLd = buildJsonLd({
    page: content,
    geo,
    parentGeo,
    kind,
    intent,
    variant,
    canonicalPath: `/seo/${slug.join("/")}`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RenderSeoTemplate
        variant={variant}
        page={content}
        geo={geo}
        parentGeo={parentGeo}
        kind={kind}
        intent={intent}
        relatedLinks={related.map((r) => ({ label: r.label, href: r.href }))}
        listingsSlot={<ListingsSlot listings={listings} />}
      />
    </>
  );
}
