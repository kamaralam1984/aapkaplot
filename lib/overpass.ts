/**
 * Locality POI fetcher — OSM Overpass API.
 *
 * Free, no API key required, 1 req/s soft limit. We cache results in
 * Postgres (LocalityInsight) for 30 days per (city, locality) — keeps
 * load to OSM minimal even with heavy traffic.
 *
 * Categories surfaced: schools, hospitals, metro stations, banks, malls,
 * restaurants. Counts only — no PII or copyrighted business data.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const CACHE_TTL_DAYS = 30;
const RADIUS_M = 2000;          // 2 km circle around the locality centroid

export interface LocalityCounts {
  schools: number;
  hospitals: number;
  metro: number;
  banks: number;
  malls: number;
  restaurants: number;
}

export interface LocalityInsight {
  cityKey: string;
  localityKey: string;
  lat: number;
  lng: number;
  amenities: LocalityCounts;
  fetchedAt: string;
  source: "overpass" | "cache";
}

const ZERO: LocalityCounts = {
  schools: 0, hospitals: 0, metro: 0, banks: 0, malls: 0, restaurants: 0,
};

function buildQuery(lat: number, lng: number, radiusM: number): string {
  // Single Overpass query that pulls all categories in one round trip.
  return `[out:json][timeout:25];
(
  node(around:${radiusM},${lat},${lng})[amenity=school];
  node(around:${radiusM},${lat},${lng})[amenity=hospital];
  node(around:${radiusM},${lat},${lng})[amenity=clinic];
  node(around:${radiusM},${lat},${lng})[amenity=bank];
  node(around:${radiusM},${lat},${lng})[amenity=restaurant];
  node(around:${radiusM},${lat},${lng})[railway=station];
  node(around:${radiusM},${lat},${lng})[railway=subway_entrance];
  node(around:${radiusM},${lat},${lng})[shop=mall];
);
out tags 200;`;
}

interface OverpassNode {
  type: string;
  tags?: Record<string, string>;
}

function tallyTags(elements: OverpassNode[]): LocalityCounts {
  const counts: LocalityCounts = { ...ZERO };
  for (const el of elements) {
    const t = el.tags ?? {};
    if (t.amenity === "school") counts.schools++;
    else if (t.amenity === "hospital" || t.amenity === "clinic") counts.hospitals++;
    else if (t.amenity === "bank") counts.banks++;
    else if (t.amenity === "restaurant") counts.restaurants++;
    if (t.railway === "station" || t.railway === "subway_entrance") counts.metro++;
    if (t.shop === "mall") counts.malls++;
  }
  return counts;
}

export async function fetchLocalityInsight(
  city: string,
  locality: string,
  lat: number,
  lng: number
): Promise<LocalityInsight> {
  const cityKey = city.trim().toLowerCase();
  const localityKey = locality.trim().toLowerCase();
  const ttlMs = CACHE_TTL_DAYS * 24 * 3600 * 1000;

  // Cache lookup.
  if (process.env.USE_DB === "1") {
    try {
      const cached = await prisma.localityInsight.findUnique({
        where: { cityKey_localityKey: { cityKey, localityKey } },
      });
      if (cached && Date.now() - cached.fetchedAt.getTime() < ttlMs) {
        const data = cached.data as { amenities?: LocalityCounts };
        return {
          cityKey, localityKey,
          lat: cached.lat,
          lng: cached.lng,
          amenities: data.amenities ?? ZERO,
          fetchedAt: cached.fetchedAt.toISOString(),
          source: "cache",
        };
      }
    } catch {
      // fall through to fresh fetch
    }
  }

  // Fresh Overpass call.
  let amenities: LocalityCounts = { ...ZERO };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AapKaPlot/1.0 (locality-insights)",
      },
      body: `data=${encodeURIComponent(buildQuery(lat, lng, RADIUS_M))}`,
      // Keep the request snappy — OSM can be slow on first hit.
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const json = (await res.json()) as { elements?: OverpassNode[] };
      amenities = tallyTags(json.elements ?? []);
    }
  } catch (err) {
    console.warn("[overpass] fetch_failed", (err as Error).message);
  }

  const fetchedAt = new Date();

  if (process.env.USE_DB === "1") {
    try {
      const data = { amenities, lastSource: "overpass" } as unknown as Prisma.InputJsonValue;
      await prisma.localityInsight.upsert({
        where: { cityKey_localityKey: { cityKey, localityKey } },
        create: { cityKey, localityKey, lat, lng, data, fetchedAt },
        update: { lat, lng, data, fetchedAt },
      });
    } catch (err) {
      console.warn("[overpass] cache_write_failed", (err as Error).message);
    }
  }

  return {
    cityKey, localityKey, lat, lng, amenities,
    fetchedAt: fetchedAt.toISOString(),
    source: "overpass",
  };
}
