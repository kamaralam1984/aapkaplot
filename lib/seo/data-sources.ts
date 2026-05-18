/**
 * Free data sources for programmatic-SEO enrichment.
 *
 * - Wikipedia REST API (`/api/rest_v1/page/summary/{title}`) → city/locality facts.
 * - OSM Nominatim (`nominatim.openstreetmap.org`) → reverse-geocode + POI nearby.
 * - OSM Overpass API (`overpass-api.de`) → POI within radius (schools, hospitals, transport).
 *
 * Both Nominatim and Overpass require a User-Agent and respect 1 rps. Since this
 * runs in the daily cron (capped at 100 pages/day per [[seo-content-rules]]),
 * rate limits are comfortable. Results are cached in the SeoPage.contentJson
 * so a page renders without any outbound calls at request time.
 */

const USER_AGENT = "AapKaPlot/1.0 (https://aapkaplot.com; seo@aapkaplot.com)";

/** Minimal sleep helper for politely spacing free-API calls. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// Wikipedia
// ─────────────────────────────────────────────────────────────

export interface WikiFacts {
  title: string;
  extract: string;          // 2-3 sentence summary
  description?: string;     // short tagline
  thumbnail?: string;
}

/**
 * Fetch a Wikipedia summary. Returns null if no page exists — many small
 * localities won't have one, which is fine; the composer falls back to
 * generated text from kind/intent templates.
 */
export async function fetchWikiSummary(name: string): Promise<WikiFacts | null> {
  const title = encodeURIComponent(name.replace(/\s+/g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
      // Cache aggressively on the platform CDN — Wikipedia summaries change rarely.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === "disambiguation" || !data.extract) return null;
    return {
      title: data.title,
      extract: data.extract,
      description: data.description,
      thumbnail: data.thumbnail?.source,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// OSM Overpass — POIs nearby
// ─────────────────────────────────────────────────────────────

export interface PoiBuckets {
  schools: number;
  hospitals: number;
  banks: number;
  atms: number;
  supermarkets: number;
  restaurants: number;
  busStops: number;
  railwayStations: number;
  parks: number;
  pharmacies: number;
  named: { school: string[]; hospital: string[]; landmark: string[] };
}

const OVERPASS_QUERY = (lat: number, lng: number, radiusM: number) => `
[out:json][timeout:25];
(
  node(around:${radiusM},${lat},${lng})[amenity=school];
  node(around:${radiusM},${lat},${lng})[amenity=hospital];
  node(around:${radiusM},${lat},${lng})[amenity=bank];
  node(around:${radiusM},${lat},${lng})[amenity=atm];
  node(around:${radiusM},${lat},${lng})[shop=supermarket];
  node(around:${radiusM},${lat},${lng})[amenity=restaurant];
  node(around:${radiusM},${lat},${lng})[highway=bus_stop];
  node(around:${radiusM},${lat},${lng})[railway=station];
  node(around:${radiusM},${lat},${lng})[leisure=park];
  node(around:${radiusM},${lat},${lng})[amenity=pharmacy];
);
out body 80;`;

/**
 * Query OSM Overpass for nearby amenities. Returns counts + a few named
 * landmarks for narrative text. Safe to call once per slug at cron time.
 */
export async function fetchNearbyPoi(
  lat: number,
  lng: number,
  radiusM = 2000,
): Promise<PoiBuckets> {
  const buckets: PoiBuckets = {
    schools: 0, hospitals: 0, banks: 0, atms: 0, supermarkets: 0,
    restaurants: 0, busStops: 0, railwayStations: 0, parks: 0, pharmacies: 0,
    named: { school: [], hospital: [], landmark: [] },
  };
  try {
    await sleep(1100); // be a polite Overpass client
    const body = "data=" + encodeURIComponent(OVERPASS_QUERY(lat, lng, radiusM));
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return buckets;
    const data = await res.json();
    type OverpassElement = {
      tags?: {
        amenity?: string;
        shop?: string;
        highway?: string;
        railway?: string;
        leisure?: string;
        name?: string;
      };
    };
    for (const el of (data.elements ?? []) as OverpassElement[]) {
      const t = el.tags ?? {};
      const name: string | undefined = t.name;
      if (t.amenity === "school") {
        buckets.schools++;
        if (name && buckets.named.school.length < 3) buckets.named.school.push(name);
      } else if (t.amenity === "hospital") {
        buckets.hospitals++;
        if (name && buckets.named.hospital.length < 3) buckets.named.hospital.push(name);
      } else if (t.amenity === "bank") buckets.banks++;
      else if (t.amenity === "atm") buckets.atms++;
      else if (t.shop === "supermarket") buckets.supermarkets++;
      else if (t.amenity === "restaurant") buckets.restaurants++;
      else if (t.highway === "bus_stop") buckets.busStops++;
      else if (t.railway === "station") {
        buckets.railwayStations++;
        if (name && buckets.named.landmark.length < 3) buckets.named.landmark.push(name);
      }
      else if (t.leisure === "park") buckets.parks++;
      else if (t.amenity === "pharmacy") buckets.pharmacies++;
    }
  } catch {
    /* swallow — composer handles empty buckets */
  }
  return buckets;
}

// ─────────────────────────────────────────────────────────────
// Listing stats — pulled from the live Property table
// ─────────────────────────────────────────────────────────────

export interface ListingStats {
  total: number;
  forSale: number;
  forRent: number;
  avgPriceLakh: number | null;
  medianPriceLakh: number | null;
  avgPriceSqftInr: number | null;
  avgAreaSqft: number | null;
  topKinds: { kind: string; count: number }[];
}

/** Compute per-city / per-locality listing statistics from the DB. Caller
 *  passes the prisma client to keep this module side-effect-free. */
export async function fetchListingStats(
  prisma: {
    property: {
      findMany: (args: {
        where: Record<string, unknown>;
        select: Record<string, boolean>;
        take: number;
      }) => Promise<Array<{
        kind?: string | null;
        intent?: string | null;
        priceInr?: number | bigint | null;
        areaSqft?: number | null;
      }>>;
    };
  },
  cityName: string,
  localityName?: string,
): Promise<ListingStats> {
  const where: Record<string, unknown> = {
    status: "ACTIVE",
    city: { equals: cityName, mode: "insensitive" },
    ...(localityName ? { locality: { equals: localityName, mode: "insensitive" } } : {}),
  };
  const rows = await prisma.property.findMany({
    where,
    select: { kind: true, intent: true, priceInr: true, areaSqft: true },
    take: 500,
  });

  const stats: ListingStats = {
    total: rows.length,
    forSale: 0, forRent: 0,
    avgPriceLakh: null, medianPriceLakh: null,
    avgPriceSqftInr: null, avgAreaSqft: null,
    topKinds: [],
  };
  if (rows.length === 0) return stats;

  const prices: number[] = [];
  const sqftPrices: number[] = [];
  const areas: number[] = [];
  const kindCount = new Map<string, number>();
  for (const r of rows) {
    // Sellers list with intent=SELL (someone selling = buyers' "for sale"); RENT is symmetric.
    if (r.intent === "SELL") stats.forSale++;
    else if (r.intent === "RENT") stats.forRent++;
    if (r.priceInr) {
      const p = Number(r.priceInr);
      prices.push(p);
      if (r.areaSqft && r.areaSqft > 0) sqftPrices.push(p / r.areaSqft);
    }
    if (r.areaSqft) areas.push(r.areaSqft);
    if (r.kind) kindCount.set(r.kind, (kindCount.get(r.kind) ?? 0) + 1);
  }
  if (prices.length) {
    const sorted = [...prices].sort((a, b) => a - b);
    stats.avgPriceLakh = Math.round((prices.reduce((s, x) => s + x, 0) / prices.length) / 100_000);
    stats.medianPriceLakh = Math.round(sorted[Math.floor(sorted.length / 2)] / 100_000);
  }
  if (sqftPrices.length) {
    stats.avgPriceSqftInr = Math.round(sqftPrices.reduce((s, x) => s + x, 0) / sqftPrices.length);
  }
  if (areas.length) {
    stats.avgAreaSqft = Math.round(areas.reduce((s, x) => s + x, 0) / areas.length);
  }
  stats.topKinds = Array.from(kindCount.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  return stats;
}
