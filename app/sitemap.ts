import type { MetadataRoute } from "next";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import { prisma } from "@/server/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

// Refresh hourly so new listings show up in Google quickly. Without this
// Next would treat the route as static and freeze it at build time —
// fatal for an SEO sitemap that needs to reflect the live catalogue.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,              changeFrequency: "daily",   priority: 1.0, lastModified: now },
    { url: `${BASE}/search`,        changeFrequency: "hourly",  priority: 0.9, lastModified: now },
    { url: `${BASE}/pricing`,       changeFrequency: "weekly",  priority: 0.7, lastModified: now },
    { url: `${BASE}/sell`,          changeFrequency: "weekly",  priority: 0.6, lastModified: now },
    { url: `${BASE}/sell/new`,      changeFrequency: "weekly",  priority: 0.6, lastModified: now },
    { url: `${BASE}/referrals`,     changeFrequency: "weekly",  priority: 0.5, lastModified: now },
    // Marketing pages
    { url: `${BASE}/about`,         changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${BASE}/contact`,       changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${BASE}/ai-technology`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${BASE}/careers`,       changeFrequency: "weekly",  priority: 0.5, lastModified: now },
    { url: `${BASE}/press`,         changeFrequency: "monthly", priority: 0.4, lastModified: now },
    { url: `${BASE}/blog`,          changeFrequency: "weekly",  priority: 0.7, lastModified: now },
    { url: `${BASE}/help`,          changeFrequency: "monthly", priority: 0.6, lastModified: now },
    // Legal pages
    { url: `${BASE}/privacy`,       changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${BASE}/terms`,         changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${BASE}/cookies`,       changeFrequency: "yearly",  priority: 0.3, lastModified: now },
    { url: `${BASE}/sitemap`,       changeFrequency: "weekly",  priority: 0.4, lastModified: now },
    // Auth — low priority, indexed for completeness
    { url: `${BASE}/me`,            changeFrequency: "monthly", priority: 0.4, lastModified: now },
    { url: `${BASE}/auth/login`,    changeFrequency: "yearly",  priority: 0.3, lastModified: now },
  ];

  const intents = ["buy", "rent"];
  const kinds = ["plot", "flat", "house", "villa", "shop", "office", "agriculture"];
  const intentKindMatrix = intents.flatMap((intent) =>
    kinds.map<MetadataRoute.Sitemap[number]>((kind) => ({
      url: `${BASE}/search?intent=${intent}&kind=${kind}`,
      changeFrequency: "daily",
      priority: 0.7,
      lastModified: now,
    }))
  );

  // Real properties from the DB. Capped at 5 000 so a single sitemap.xml
  // stays under Google's 50 MB / 50 000 URL ceiling with margin. Falls back
  // to an empty array when the DB is unreachable or USE_DB is disabled —
  // the static skeleton still ships.
  let propertyPages: MetadataRoute.Sitemap = [];
  let dbLocalityKeys: Set<string> = new Set();
  if (process.env.USE_DB === "1") {
    try {
      const rows = await prisma.property.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, city: true, locality: true, coverUrl: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      });
      propertyPages = rows.map((p) => ({
        url: `${BASE}/property/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        // Image annotation helps Google Images index the cover photo with
        // the listing — significant traffic source for property searches.
        images: p.coverUrl ? [p.coverUrl] : undefined,
      }));
      // Derive city/locality long-tail pages from live data, not seeds.
      for (const p of rows) {
        const c = p.city.toLowerCase();
        const l = p.locality.toLowerCase().replace(/\s+/g, "-");
        if (c && l) dbLocalityKeys.add(`${c}/${l}`);
      }
    } catch (err) {
      console.warn("[sitemap] db_fetch_failed, skipping property URLs", err);
    }
  }

  // City + city/kind SEO landings
  const cities = ["kolkata", "bengaluru", "mumbai", "pune", "delhi"];
  const cityKinds = ["flats", "houses", "plots", "villas", "commercial", "agriculture"];
  const cityPages: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${BASE}/in/${c}`,
    changeFrequency: "daily",
    priority: 0.85,
    lastModified: now,
  }));
  const cityKindPages: MetadataRoute.Sitemap = cities.flatMap((c) =>
    cityKinds.map((k) => ({
      url: `${BASE}/in/${c}/${k}`,
      changeFrequency: "daily",
      priority: 0.75,
      lastModified: now,
    }))
  );

  // Per-city project list pages
  const cityProjectPages: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${BASE}/in/${c}/projects`,
    changeFrequency: "weekly",
    priority: 0.7,
    lastModified: now,
  }));

  // Individual project detail pages (seed + DB later).
  const projectPages: MetadataRoute.Sitemap = MOCK_PROJECTS.map((p) => ({
    url: `${BASE}/in/${p.city.toLowerCase()}/projects/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.72,
    lastModified: now,
  }));

  // Locality long-tail pages — derived from the live DB catalogue.
  const localityPages: MetadataRoute.Sitemap = Array.from(dbLocalityKeys).map((path) => {
    // path is "city/locality" — re-segment for the /area/ route.
    const [city, locality] = path.split("/");
    return {
      url: `${BASE}/in/${city}/area/${locality}`,
      changeFrequency: "weekly" as const,
      priority: 0.68,
      lastModified: now,
    };
  });

  return [
    ...staticPages,
    ...intentKindMatrix,
    ...cityPages,
    ...cityKindPages,
    ...cityProjectPages,
    ...projectPages,
    ...localityPages,
    ...propertyPages,
  ];
}
