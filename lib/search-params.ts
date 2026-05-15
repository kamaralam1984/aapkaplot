import type { ListingIntent, PropertyKind, AmenityId } from "./types";

export type SortKey =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "distance"
  | "trust";

export type ViewMode = "list" | "split" | "map";

export interface ParsedSearchFilters {
  q?: string;
  intent?: ListingIntent;
  kind?: PropertyKind;
  bhk?: number;
  budgetMin?: number;
  budgetMax?: number;
  areaMin?: number;
  areaMax?: number;
  parking?: boolean;
  furnishing?: "unfurnished" | "semi" | "full";
  nearby: ("school" | "metro" | "hospital" | "market")[];
  verifiedOnly?: boolean;
  amenities: AmenityId[];
  radiusKm?: number;
  originLat?: number;
  originLng?: number;
  sort: SortKey;
  view: ViewMode;
  page: number;
}

const INTENT_VALUES = new Set<ListingIntent>(["buy", "rent", "sell"]);
const KIND_VALUES = new Set<PropertyKind>([
  "plot", "flat", "house", "villa", "shop", "office", "warehouse", "agriculture",
]);
const AMENITY_VALUES = new Set<AmenityId>([
  "parking", "power-backup", "water-supply", "lift", "gym", "pool", "garden",
  "security", "cctv", "playground", "clubhouse", "wifi", "ac", "furnished",
  "pet-friendly",
]);
const SORT_VALUES = new Set<SortKey>(["newest", "price-asc", "price-desc", "distance", "trust"]);
const VIEW_VALUES = new Set<ViewMode>(["list", "split", "map"]);

function num(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function get(input: SearchParamsInput, key: string): string | string[] | undefined {
  if (input instanceof URLSearchParams) {
    const all = input.getAll(key);
    if (all.length === 0) return undefined;
    return all.length === 1 ? all[0] : all;
  }
  return input[key];
}

export function parseSearchParams(input: SearchParamsInput): ParsedSearchFilters {
  const intent = str(get(input, "intent"));
  const kind = str(get(input, "kind"));
  const sort = str(get(input, "sort"));
  const view = str(get(input, "view"));
  const bhk = num(get(input, "bhk"));

  // amenities can be repeated `?amenities=parking&amenities=gym` or comma-joined.
  const amenitiesRaw = get(input, "amenities");
  const amenitiesArr =
    amenitiesRaw == null
      ? []
      : Array.isArray(amenitiesRaw)
      ? amenitiesRaw
      : amenitiesRaw.split(",");
  const amenities = amenitiesArr
    .map((a) => a.trim() as AmenityId)
    .filter((a) => AMENITY_VALUES.has(a));

  const furnishingRaw = str(get(input, "furnishing"));
  const furnishing =
    furnishingRaw === "unfurnished" || furnishingRaw === "semi" || furnishingRaw === "full"
      ? furnishingRaw
      : undefined;

  const nearbyRaw = get(input, "nearby");
  const nearbyArr =
    nearbyRaw == null ? []
    : Array.isArray(nearbyRaw) ? nearbyRaw
    : nearbyRaw.split(",");
  const validNearby = new Set(["school", "metro", "hospital", "market"]);
  const nearby = nearbyArr.filter((x) => validNearby.has(x)) as ("school" | "metro" | "hospital" | "market")[];

  return {
    q: str(get(input, "q")),
    intent: intent && INTENT_VALUES.has(intent as ListingIntent) ? (intent as ListingIntent) : undefined,
    kind: kind && KIND_VALUES.has(kind as PropertyKind) ? (kind as PropertyKind) : undefined,
    bhk: bhk && bhk > 0 ? Math.min(10, Math.floor(bhk)) : undefined,
    budgetMin: num(get(input, "budgetMin")),
    budgetMax: num(get(input, "budgetMax")),
    areaMin: num(get(input, "areaMin")),
    areaMax: num(get(input, "areaMax")),
    parking: str(get(input, "parking")) === "1",
    furnishing,
    nearby,
    verifiedOnly: str(get(input, "verifiedOnly")) === "1",
    amenities,
    radiusKm: num(get(input, "radiusKm")),
    originLat: num(get(input, "lat")),
    originLng: num(get(input, "lng")),
    sort: sort && SORT_VALUES.has(sort as SortKey) ? (sort as SortKey) : "newest",
    view: view && VIEW_VALUES.has(view as ViewMode) ? (view as ViewMode) : "split",
    page: Math.max(1, num(get(input, "page")) ?? 1),
  };
}

/** Build a URLSearchParams from a filter set, omitting defaults. */
export function serializeFilters(f: Partial<ParsedSearchFilters>): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.intent) p.set("intent", f.intent);
  if (f.kind) p.set("kind", f.kind);
  if (f.bhk) p.set("bhk", String(f.bhk));
  if (typeof f.budgetMin === "number") p.set("budgetMin", String(f.budgetMin));
  if (typeof f.budgetMax === "number") p.set("budgetMax", String(f.budgetMax));
  if (f.verifiedOnly) p.set("verifiedOnly", "1");
  if (f.amenities && f.amenities.length > 0) p.set("amenities", f.amenities.join(","));
  if (typeof f.radiusKm === "number") p.set("radiusKm", String(f.radiusKm));
  if (typeof f.originLat === "number") p.set("lat", String(f.originLat));
  if (typeof f.originLng === "number") p.set("lng", String(f.originLng));
  if (f.sort && f.sort !== "newest") p.set("sort", f.sort);
  if (f.view && f.view !== "split") p.set("view", f.view);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  return p;
}

/** Returns a new query string with one key updated; preserves the rest. */
export function patchSearchParams(
  current: URLSearchParams | ReadonlyURLSearchParams,
  patch: Record<string, string | number | boolean | string[] | null | undefined>
): string {
  const next = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "" || v === false) next.delete(k);
    else if (Array.isArray(v)) {
      if (v.length === 0) next.delete(k);
      else next.set(k, v.join(","));
    } else next.set(k, String(v));
  }
  // Reset to page 1 on any filter change unless explicitly setting page.
  if (!("page" in patch)) next.delete("page");
  return next.toString();
}

// minimal type to match next/navigation ReadonlyURLSearchParams
type ReadonlyURLSearchParams = Pick<URLSearchParams, "get" | "getAll" | "has" | "toString">;
