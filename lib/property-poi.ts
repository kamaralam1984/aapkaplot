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
  | "park" | "historical" | "tourism"
  | "bus_stop" | "place_of_worship" | "market"
  | "water_park" | "gym" | "other";

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
// 15 km is the base radius for everyday amenities (banks, restaurants,
// schools…). Travel / heritage / airports widen this multiplier below.
// Larger than the previous 8 km because OSM coverage in tier-2 Indian
// towns is patchy — a local police chowki two streets away may not be
// mapped, so we have to look further to find the closest tagged node.
const RADIUS_M = 15000;
const MAX_DISPLAY_KM = 30;
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
  // Radius rules of thumb (Indian tier-2 coverage):
  //   • Local services (police, fuel, ATMs, banks): r * 3.5 ≈ 50 km — sparse
  //     maps often miss the nearest 2–3 km; we'd rather show a real hit.
  //   • Transit nodes: r * 3 ≈ 45 km — junctions can be cross-district.
  //   • Airports: r * 7 ≈ 100 km — Bihta, Gaya etc. are still relevant.
  //   • Everyday shops/food: r = 15 km is enough.
  //
  // Each category accepts MULTIPLE OSM tags because mappers don't agree:
  // a hospital may be amenity=hospital, healthcare=hospital, or just
  // building=hospital. We aim wide and let classify() bucket them.
  const big = Math.round(r * 3.5);
  const huge = Math.round(r * 7);
  const mid = r * 2;
  return `[out:json][timeout:25];
(
  // Railway — station + halt + metro entrance. Ways picked up for big terminals.
  node(around:${r * 3},${lat},${lng})[railway=station];
  way (around:${r * 3},${lat},${lng})[railway=station];
  node(around:${r * 3},${lat},${lng})[railway=halt];
  node(around:${r * 3},${lat},${lng})[railway=subway_entrance];
  // Airports — node + way (large airports are tagged as ways).
  node(around:${huge},${lat},${lng})[aeroway=aerodrome];
  way (around:${huge},${lat},${lng})[aeroway=aerodrome];
  // Hospitals / clinics — accept node + way; also healthcare=* and building=hospital.
  node(around:${mid},${lat},${lng})[amenity=hospital];
  way (around:${mid},${lat},${lng})[amenity=hospital];
  node(around:${mid},${lat},${lng})[amenity=clinic];
  node(around:${mid},${lat},${lng})[healthcare=hospital];
  way (around:${mid},${lat},${lng})[healthcare=hospital];
  node(around:${mid},${lat},${lng})[building=hospital];
  way (around:${mid},${lat},${lng})[building=hospital];
  // Pharmacies feed into the hospital basket (separate category, see classify).
  node(around:${r},${lat},${lng})[amenity=pharmacy];
  // Schools — multiple tag styles.
  node(around:${r},${lat},${lng})[amenity=school];
  way (around:${r},${lat},${lng})[amenity=school];
  node(around:${r},${lat},${lng})[building=school];
  way (around:${r},${lat},${lng})[building=school];
  // Colleges + universities — both go into the colleges bucket.
  node(around:${mid},${lat},${lng})[amenity=college];
  way (around:${mid},${lat},${lng})[amenity=college];
  node(around:${mid},${lat},${lng})[amenity=university];
  way (around:${mid},${lat},${lng})[amenity=university];
  node(around:${mid},${lat},${lng})[building=university];
  way (around:${mid},${lat},${lng})[building=university];
  // Malls + supermarkets — also accept convenience / grocery / department stores.
  node(around:${mid},${lat},${lng})[shop=mall];
  way (around:${mid},${lat},${lng})[shop=mall];
  node(around:${mid},${lat},${lng})[shop=department_store];
  node(around:${r},${lat},${lng})[shop=supermarket];
  node(around:${r},${lat},${lng})[shop=convenience];
  node(around:${r},${lat},${lng})[shop=grocery];
  // Food — restaurants + cafes + fast food.
  node(around:${r},${lat},${lng})[amenity=restaurant];
  node(around:${r},${lat},${lng})[amenity=cafe];
  node(around:${r},${lat},${lng})[amenity=fast_food];
  // Banks — amenity + office=bank (commercial branches).
  node(around:${big},${lat},${lng})[amenity=bank];
  node(around:${big},${lat},${lng})[office=bank];
  // ATMs.
  node(around:${big},${lat},${lng})[amenity=atm];
  // Police — many small chowkis tagged inconsistently.
  node(around:${big},${lat},${lng})[amenity=police];
  way (around:${big},${lat},${lng})[amenity=police];
  node(around:${big},${lat},${lng})[building=police];
  node(around:${big},${lat},${lng})[office=police];
  // Fuel.
  node(around:${big},${lat},${lng})[amenity=fuel];
  // Parks + open green space.
  node(around:${mid},${lat},${lng})[leisure=park];
  way (around:${mid},${lat},${lng})[leisure=park];
  node(around:${mid},${lat},${lng})[leisure=garden];
  // Tourism + heritage.
  node(around:${huge},${lat},${lng})[tourism=museum];
  node(around:${huge},${lat},${lng})[tourism=attraction];
  node(around:${huge},${lat},${lng})[tourism=viewpoint];
  node(around:${huge},${lat},${lng})[historic];
  // Bus stops + stands.
  node(around:${r},${lat},${lng})[highway=bus_stop];
  node(around:${r},${lat},${lng})[amenity=bus_station];
  // Places of worship — temple, mosque, church, gurudwara.
  node(around:${r},${lat},${lng})[amenity=place_of_worship];
  way (around:${r},${lat},${lng})[amenity=place_of_worship];
  // Markets + bazaars.
  node(around:${r},${lat},${lng})[amenity=marketplace];
  node(around:${r},${lat},${lng})[shop=market];
  way (around:${r},${lat},${lng})[amenity=marketplace];
);
out tags center 800;`;
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
  // Railway: prefer named stations, then halts. Both share a bucket.
  if (tags.railway === "station" || tags.railway === "halt") return "railway";
  if (tags.railway === "subway_entrance") return "metro";
  // Airports.
  if (tags.aeroway === "aerodrome") return "airport";
  // Hospitals — any of the common tag styles plus pharmacies as a fallback
  // (rural areas often have pharmacies but no clinic node nearby).
  if (
    tags.amenity === "hospital" ||
    tags.amenity === "clinic" ||
    tags.amenity === "pharmacy" ||
    tags.healthcare === "hospital" ||
    tags.building === "hospital"
  ) return "hospital";
  // Schools — amenity OR building tagging both common.
  if (tags.amenity === "school" || tags.building === "school") return "school";
  // Colleges + universities → single bucket.
  if (
    tags.amenity === "college" ||
    tags.amenity === "university" ||
    tags.building === "college" ||
    tags.building === "university"
  ) return "college";
  // Shopping.
  if (tags.shop === "mall" || tags.shop === "department_store") return "mall";
  if (
    tags.shop === "supermarket" ||
    tags.shop === "convenience" ||
    tags.shop === "grocery"
  ) return "supermarket";
  // Food.
  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "cafe" ||
    tags.amenity === "fast_food"
  ) return "restaurant";
  // Money.
  if (tags.amenity === "bank" || tags.office === "bank") return "bank";
  if (tags.amenity === "atm") return "atm";
  // Police — any of the common tag styles.
  if (
    tags.amenity === "police" ||
    tags.building === "police" ||
    tags.office === "police"
  ) return "police";
  // Fuel.
  if (tags.amenity === "fuel") return "fuel";
  // Parks + green space.
  if (tags.leisure === "park" || tags.leisure === "garden") return "park";
  // Tourism + heritage.
  if (
    tags.tourism === "museum" ||
    tags.tourism === "attraction" ||
    tags.tourism === "viewpoint"
  ) return "tourism";
  if (tags.historic) return "historical";
  // Bus stops + stands.
  if (tags.highway === "bus_stop" || tags.amenity === "bus_station") return "bus_stop";
  // Places of worship.
  if (tags.amenity === "place_of_worship") return "place_of_worship";
  // Markets + bazaars.
  if (tags.amenity === "marketplace" || tags.shop === "market") return "market";
  return null;
}

const CATEGORY_ORDER: PoiCategory[] = [
  "metro", "railway", "airport", "bus_stop",
  "hospital", "school", "college",
  "mall", "supermarket", "restaurant", "market",
  "bank", "atm", "police", "fuel",
  "park", "water_park", "gym", "place_of_worship", "tourism", "historical",
  "other",
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
  //    "property-poi-v3" + bucket so it never collides with locality data).
  try {
    if (process.env.USE_DB === "1") {
      const row = await prisma.localityInsight.findUnique({
        where: { cityKey_localityKey: { cityKey: "property-poi-v3", localityKey: key } },
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
    // Only show POIs within 30 km — beyond that they aren't useful for buyers.
    items = items.filter((p) => p.distanceKm <= MAX_DISPLAY_KM);
  }

  // Group top-3 by category, deduping by lowercase name. OSM frequently has
  // multiple nodes with the same name within a small area (e.g. a station +
  // its sub-platform marked separately). Keeping only the closest occurrence
  // per name produces a much cleaner card.
  const byCategory: Partial<Record<PoiCategory, Poi[]>> = {};
  const seenNamesPerCat = new Map<PoiCategory, Set<string>>();
  for (const it of items) {
    const seen = seenNamesPerCat.get(it.category) ?? new Set<string>();
    const key = it.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    seenNamesPerCat.set(it.category, seen);
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
        where: { cityKey_localityKey: { cityKey: "property-poi-v3", localityKey: key } },
        create: {
          cityKey: "property-poi-v3",
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
