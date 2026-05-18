/**
 * Property-specific POI fetcher — runs Overpass on a property's coords and
 * returns the closest landmarks across a rich set of categories useful for
 * marketing copy:
 *   railway station · airport · metro · hospital · school · college ·
 *   shopping mall · supermarket · restaurant · cafe · bank · ATM ·
 *   police · petrol pump · park · historical / heritage · tourist spot
 *
 * Free — Overpass (OpenStreetMap), no API key, 24-hour Postgres cache via
 * `LocalityInsight` model keyed by (city, locality) — for properties we add
 * an in-memory layer on top so the same coordinates don't re-fetch.
 *
 * Computes haversine distance per result so cards show "12.4 km" labels
 * directly without a second roundtrip.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { haversineKm } from "./haversine";

export type PoiCategory =
  | "railway" | "metro" | "airport"
  | "hospital" | "school" | "college"
  | "mall" | "supermarket" | "restaurant"
  | "bank" | "atm" | "police" | "fuel"
  | "park" | "historical" | "tourism";

export interface Poi {
  id: string;            // overpass element id
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  /** Distance in km — road distance from OSRM when available, else straight-line. */
  distanceKm: number;
  /** "road" = driving distance via OSRM, "straight" = haversine fallback. */
  distanceType: "road" | "straight";
}

export interface PropertyPoiBundle {
  fetchedAt: string;
  source: "overpass" | "cache" | "fallback";
  /** All POIs flattened, sorted by distance ASC. */
  items: Poi[];
  /** Per-category top-3 nearest. */
  byCategory: Partial<Record<PoiCategory, Poi[]>>;
  /** Human-readable AI-style marketing highlights. */
  highlights: string[];
}

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const OSRM_TABLE = "https://router.project-osrm.org/table/v1/driving";
const RADIUS_M = 8000;     // 8 km — wide enough to catch airports + stations
const CACHE_TTL_DAYS = 30;
// OSRM public server is generous but not unlimited. Cap one batch at 25 so a
// single property load never blocks the table for other users.
const OSRM_MAX_DESTINATIONS = 25;

const MEM_CACHE = new Map<string, { at: number; bundle: PropertyPoiBundle }>();

function cacheKey(lat: number, lng: number) {
  // 3-decimal precision → ~110 m bucket — neighbouring listings reuse.
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function buildQuery(lat: number, lng: number): string {
  const r = RADIUS_M;
  // One Overpass query covering every POI we render. Each element returns
  // a name tag where present — we drop unnamed nodes for a clean UI.
  return `[out:json][timeout:25];
(
  // Transit & airports — important enough to use a bigger radius.
  node(around:${r * 2},${lat},${lng})[railway=station];
  node(around:${r * 2},${lat},${lng})[railway=subway_entrance];
  node(around:${r * 4},${lat},${lng})[aeroway=aerodrome];
  way (around:${r * 4},${lat},${lng})[aeroway=aerodrome];
  // Hospitals, schools, colleges.
  node(around:${r},${lat},${lng})[amenity=hospital];
  node(around:${r},${lat},${lng})[amenity=clinic];
  node(around:${r},${lat},${lng})[amenity=school];
  node(around:${r},${lat},${lng})[amenity=college];
  node(around:${r},${lat},${lng})[amenity=university];
  // Shopping & food.
  node(around:${r},${lat},${lng})[shop=mall];
  node(around:${r},${lat},${lng})[shop=supermarket];
  node(around:${r},${lat},${lng})[amenity=restaurant];
  node(around:${r},${lat},${lng})[amenity=cafe];
  // Services.
  node(around:${r},${lat},${lng})[amenity=bank];
  node(around:${r},${lat},${lng})[amenity=atm];
  node(around:${r},${lat},${lng})[amenity=police];
  node(around:${r},${lat},${lng})[amenity=fuel];
  // Leisure, heritage, tourism.
  node(around:${r * 2},${lat},${lng})[leisure=park];
  node(around:${r * 2},${lat},${lng})[tourism=museum];
  node(around:${r * 2},${lat},${lng})[tourism=attraction];
  node(around:${r * 2},${lat},${lng})[historic];
);
out tags center 400;`;
}

interface OverpassEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function classify(tags: Record<string, string>): PoiCategory | null {
  if (tags.railway === "station") return "railway";
  if (tags.railway === "subway_entrance") return "metro";
  if (tags.aeroway === "aerodrome") return "airport";
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "hospital";
  if (tags.amenity === "school") return "school";
  if (tags.amenity === "college" || tags.amenity === "university") return "college";
  if (tags.shop === "mall") return "mall";
  if (tags.shop === "supermarket") return "supermarket";
  if (tags.amenity === "restaurant") return "restaurant";
  if (tags.amenity === "cafe") return "restaurant";
  if (tags.amenity === "bank") return "bank";
  if (tags.amenity === "atm") return "atm";
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "fuel") return "fuel";
  if (tags.leisure === "park") return "park";
  if (tags.tourism === "museum" || tags.tourism === "attraction") return "tourism";
  if (tags.historic) return "historical";
  return null;
}

const CATEGORY_ORDER: PoiCategory[] = [
  "metro", "railway", "airport",
  "hospital", "school", "college",
  "mall", "supermarket", "restaurant",
  "bank", "atm", "police", "fuel",
  "park", "tourism", "historical",
];

function poiDistanceLabel(p: Poi): string {
  // Driving distance: real number. Crow-flies: prefix with "≈" so users know
  // it's a fallback and may understate winding routes.
  return p.distanceType === "road" ? formatKm(p.distanceKm) : `≈ ${formatKm(p.distanceKm)}`;
}

function buildHighlights(byCat: Partial<Record<PoiCategory, Poi[]>>): string[] {
  const out: string[] = [];
  const nearest = (cat: PoiCategory) => byCat[cat]?.[0];
  const m = nearest("metro");
  if (m) out.push(`Metro at ${m.name} — ${poiDistanceLabel(m)} away`);
  const r = nearest("railway");
  if (r) out.push(`Railway station: ${r.name} (${poiDistanceLabel(r)})`);
  const a = nearest("airport");
  if (a) out.push(`Airport: ${a.name} reachable in ${poiDistanceLabel(a)}`);
  const h = nearest("hospital");
  if (h) out.push(`Hospital ${h.name} — ${poiDistanceLabel(h)}`);
  const s = byCat.school?.length ?? 0;
  if (s) out.push(`${s} school${s === 1 ? "" : "s"} within ${poiDistanceLabel(byCat.school![s - 1])}`);
  const mall = nearest("mall");
  if (mall) out.push(`Shopping at ${mall.name} (${poiDistanceLabel(mall)})`);
  const hist = nearest("historical");
  if (hist) out.push(`Heritage spot: ${hist.name} — ${poiDistanceLabel(hist)}`);
  const tour = nearest("tourism");
  if (tour) out.push(`Tourist attraction nearby: ${tour.name}`);
  return out.slice(0, 5);
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Replace haversine distance with real driving distance for the closest
 * `OSRM_MAX_DESTINATIONS` POIs. Single OSRM Table call → matrix of road
 * metres. Anything past the cap keeps the straight-line value (marked as
 * such so the UI can flag it).
 *
 * Free public OSRM has no API key but is rate-limited. The 30-day cache
 * upstream keeps usage low — most loads hit the cache, not the network.
 */
async function annotateRoadDistances(
  origin: { lat: number; lng: number },
  items: Poi[],
): Promise<Poi[]> {
  if (items.length === 0) return items;
  const head = items.slice(0, OSRM_MAX_DESTINATIONS);
  const coords = [
    `${origin.lng},${origin.lat}`,
    ...head.map((p) => `${p.lng},${p.lat}`),
  ].join(";");
  const dests = Array.from({ length: head.length }, (_, i) => i + 1).join(";");
  const url = `${OSRM_TABLE}/${coords}?annotations=distance&sources=0&destinations=${dests}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AapKaPlot/1.0 (property-poi)" },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`osrm_status_${res.status}`);
    const data = (await res.json()) as { code?: string; distances?: number[][] };
    if (data.code !== "Ok" || !Array.isArray(data.distances?.[0])) {
      throw new Error("osrm_bad_shape");
    }
    const row = data.distances[0];
    return items.map((p, i): Poi => {
      if (i < head.length && typeof row[i] === "number" && row[i] > 0) {
        return { ...p, distanceKm: row[i] / 1000, distanceType: "road" };
      }
      return { ...p, distanceType: "straight" };
    });
  } catch (err) {
    console.warn("[property-poi] osrm_failed, keeping haversine", (err as Error).message);
    return items.map((p): Poi => ({ ...p, distanceType: "straight" }));
  }
}

/**
 * Main entrypoint — call from a server component / API route.
 * Returns fully-shaped bundle even when Overpass is down (empty items).
 */
export async function fetchPropertyPois(lat: number, lng: number): Promise<PropertyPoiBundle> {
  const key = cacheKey(lat, lng);

  // 1. In-memory cache (per dev-process / per-server-instance).
  const mem = MEM_CACHE.get(key);
  if (mem && Date.now() - mem.at < CACHE_TTL_DAYS * 86400 * 1000) {
    return { ...mem.bundle, source: "cache" };
  }

  // 2. Persistent cache via LocalityInsight (reuse table — keyed by
  //    "property-poi-v2" + bucket so it never collides with locality data).
  try {
    if (process.env.USE_DB === "1") {
      const row = await prisma.localityInsight.findUnique({
        where: { cityKey_localityKey: { cityKey: "property-poi-v2", localityKey: key } },
      });
      if (row && Date.now() - row.fetchedAt.getTime() < CACHE_TTL_DAYS * 86400 * 1000) {
        const bundle = row.data as unknown as PropertyPoiBundle;
        MEM_CACHE.set(key, { at: Date.now(), bundle });
        return { ...bundle, source: "cache" };
      }
    }
  } catch {
    // fall through to network fetch
  }

  // 3. Overpass fetch.
  let items: Poi[] = [];
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AapKaPlot/1.0 (property-poi)",
      },
      body: `data=${encodeURIComponent(buildQuery(lat, lng))}`,
      signal: AbortSignal.timeout(25_000),
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const json = (await res.json()) as { elements?: OverpassEl[] };
      for (const el of json.elements ?? []) {
        const tags = el.tags ?? {};
        const name = tags.name ?? tags["name:en"];
        if (!name) continue;
        const cat = classify(tags);
        if (!cat) continue;
        const plat = el.lat ?? el.center?.lat;
        const plng = el.lon ?? el.center?.lon;
        if (typeof plat !== "number" || typeof plng !== "number") continue;
        items.push({
          id: `${el.type}/${el.id}`,
          name,
          category: cat,
          lat: plat,
          lng: plng,
          distanceKm: haversineKm({ lat, lng }, { lat: plat, lng: plng }),
          distanceType: "straight",
        });
      }
      items.sort((a, b) => a.distanceKm - b.distanceKm);
    }
  } catch (err) {
    console.warn("[property-poi] fetch_failed", (err as Error).message);
  }

  // Upgrade haversine distances to real driving distances via OSRM.
  // Single network call covers the top 25 — anything past that stays
  // straight-line. Re-sort because driving order can differ from crow-flies.
  if (items.length > 0) {
    items = await annotateRoadDistances({ lat, lng }, items);
    items.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // Group top-3 by category for compact rendering.
  const byCategory: Partial<Record<PoiCategory, Poi[]>> = {};
  for (const it of items) {
    const list = byCategory[it.category] ?? [];
    if (list.length < 3) {
      list.push(it);
      byCategory[it.category] = list;
    }
  }

  const bundle: PropertyPoiBundle = {
    fetchedAt: new Date().toISOString(),
    source: items.length > 0 ? "overpass" : "fallback",
    items,
    byCategory,
    highlights: buildHighlights(byCategory),
  };

  // Persist to memory + DB cache.
  MEM_CACHE.set(key, { at: Date.now(), bundle });
  try {
    if (process.env.USE_DB === "1" && items.length > 0) {
      const data = bundle as unknown as Prisma.InputJsonValue;
      await prisma.localityInsight.upsert({
        where: { cityKey_localityKey: { cityKey: "property-poi-v2", localityKey: key } },
        create: {
          cityKey: "property-poi-v2",
          localityKey: key,
          lat, lng,
          data,
          fetchedAt: new Date(),
        },
        update: { data, fetchedAt: new Date() },
      });
    }
  } catch (err) {
    console.warn("[property-poi] cache_write_failed", (err as Error).message);
  }

  return bundle;
}

export { CATEGORY_ORDER, formatKm, poiDistanceLabel };
