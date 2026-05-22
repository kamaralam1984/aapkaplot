import { NextResponse } from "next/server";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

function url(loc: string, lastmod?: Date | string, changefreq?: string, priority?: number, images?: string[]) {
  const mod = lastmod ? `\n  <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : "";
  const freq = changefreq ? `\n  <changefreq>${changefreq}</changefreq>` : "";
  const pri = priority !== undefined ? `\n  <priority>${priority}</priority>` : "";
  const imgs = images?.length
    ? images.map((img) => `\n  <image:image><image:loc>${img}</image:loc></image:image>`).join("")
    : "";
  return `<url>\n  <loc>${loc}</loc>${mod}${freq}${pri}${imgs}\n</url>`;
}

export async function GET() {
  const now = new Date();

  const staticUrls = [
    url(`${BASE}/`,              now, "daily",   1.0),
    url(`${BASE}/search`,        now, "hourly",  0.9),
    url(`${BASE}/properties`,    now, "hourly",  0.9),
    url(`${BASE}/pricing`,       now, "weekly",  0.7),
    url(`${BASE}/sell`,          now, "weekly",  0.6),
    url(`${BASE}/about`,         now, "monthly", 0.6),
    url(`${BASE}/contact`,       now, "monthly", 0.6),
    url(`${BASE}/blog`,          now, "weekly",  0.7),
    url(`${BASE}/help`,          now, "monthly", 0.6),
    url(`${BASE}/ai-technology`, now, "monthly", 0.5),
    url(`${BASE}/careers`,       now, "weekly",  0.5),
    url(`${BASE}/sitemap`,       now, "weekly",  0.4),
    url(`${BASE}/privacy`,       now, "yearly",  0.3),
    url(`${BASE}/terms`,         now, "yearly",  0.3),
  ];

  const intents = ["buy", "rent"];
  const kinds = ["plot", "flat", "house", "villa", "shop", "office", "agriculture"];
  const searchUrls = intents.flatMap((i) =>
    kinds.map((k) => url(`${BASE}/search?intent=${i}&kind=${k}`, now, "daily", 0.7))
  );

  const cities = ["kolkata", "bengaluru", "mumbai", "pune", "delhi", "patna", "ranchi"];
  const cityKinds = ["flats", "houses", "plots", "villas", "commercial"];
  const cityUrls = cities.map((c) => url(`${BASE}/in/${c}`, now, "daily", 0.85));
  const cityKindUrls = cities.flatMap((c) =>
    cityKinds.map((k) => url(`${BASE}/in/${c}/${k}`, now, "daily", 0.75))
  );
  const projectUrls = MOCK_PROJECTS.map((p) =>
    url(`${BASE}/in/${p.city.toLowerCase()}/projects/${p.slug}`, now, "weekly", 0.72)
  );

  let propertyUrls: string[] = [];
  let localityUrls: string[] = [];
  let seoUrls: string[] = [];

  if (process.env.USE_DB === "1") {
    try {
      const props = await prisma.property.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, city: true, locality: true, coverUrl: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      });
      const localitySet = new Set<string>();
      for (const p of props) {
        propertyUrls.push(url(
          `${BASE}/property/${p.id}`, p.updatedAt, "weekly", 0.8,
          p.coverUrl ? [p.coverUrl] : undefined
        ));
        const c = p.city.toLowerCase();
        const l = p.locality.toLowerCase().replace(/\s+/g, "-");
        if (c && l) localitySet.add(`${c}/${l}`);
      }
      localityUrls = Array.from(localitySet).map((path) => {
        const [city, loc] = path.split("/");
        return url(`${BASE}/in/${city}/area/${loc}`, now, "weekly", 0.68);
      });
    } catch { /* skip */ }

    try {
      const seoRows = await prisma.seoPage.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, lastBuiltAt: true, qualityScore: true },
        orderBy: [{ qualityScore: "desc" }, { lastBuiltAt: "desc" }],
        take: 45000,
      });
      seoUrls = seoRows.map((r) =>
        url(`${BASE}/seo/${r.slug}`, r.lastBuiltAt, "weekly",
          Math.min(0.78, 0.55 + (r.qualityScore - 70) / 200))
      );
    } catch { /* skip */ }
  }

  const allUrls = [
    ...staticUrls, ...searchUrls, ...cityUrls, ...cityKindUrls,
    ...projectUrls, ...localityUrls, ...propertyUrls, ...seoUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Vary": "Accept-Encoding",
    },
  });
}
