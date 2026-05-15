import type { MetadataRoute } from "next";
import { MOCK_PROPERTIES } from "@/lib/mock-data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,         changeFrequency: "daily",   priority: 1.0, lastModified: now },
    { url: `${BASE}/search`,   changeFrequency: "hourly",  priority: 0.9, lastModified: now },
    { url: `${BASE}/pricing`,  changeFrequency: "weekly",  priority: 0.6, lastModified: now },
    { url: `${BASE}/sell`,     changeFrequency: "weekly",  priority: 0.6, lastModified: now },
    { url: `${BASE}/me`,       changeFrequency: "monthly", priority: 0.4, lastModified: now },
    { url: `${BASE}/auth/login`, changeFrequency: "yearly", priority: 0.3, lastModified: now },
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

  const propertyPages = MOCK_PROPERTIES.map<MetadataRoute.Sitemap[number]>((p) => ({
    url: `${BASE}/property/${p.id}`,
    lastModified: new Date(p.postedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

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

  return [...staticPages, ...intentKindMatrix, ...cityPages, ...cityKindPages, ...propertyPages];
}
