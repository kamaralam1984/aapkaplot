import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "./mock-data";
import { haversineKm } from "./haversine";
import type { Property } from "./types";
import type { ParsedSearchFilters } from "./search-params";

export const PAGE_SIZE = 12;

export interface SearchResult {
  items: (Property & { distanceKm: number })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  origin: { lat: number; lng: number };
}

/**
 * Run filters → distance → sort → paginate. Pure function so the server
 * component can compute SSR-friendly results from the URL.
 */
export function runSearch(filters: ParsedSearchFilters): SearchResult {
  const origin =
    filters.originLat != null && filters.originLng != null
      ? { lat: filters.originLat, lng: filters.originLng }
      : DEFAULT_ORIGIN;

  // 1. Filter
  let items: (Property & { distanceKm: number })[] = MOCK_PROPERTIES.map(
    (p) => ({
      ...p,
      distanceKm: haversineKm(origin, p.location.coords),
    })
  );

  if (filters.q) {
    const q = filters.q.toLowerCase().trim();
    // Lightweight fuzzy: any whitespace-separated token must hit (substring OR
    // prefix in any field). Survives typos like "kolkat" → "kolkata".
    const tokens = q.split(/\s+/).filter(Boolean);
    items = items
      .map((p) => {
        const hay = `${p.title} ${p.location.locality} ${p.location.city} ${p.location.state} ${p.kind}`.toLowerCase();
        let score = 0;
        let matched = 0;
        for (const t of tokens) {
          if (hay.includes(t)) {
            matched++;
            score += hay.startsWith(t) ? 5 : 2;
          } else {
            // typo tolerance — allow 1 character missing if token length > 4
            if (t.length > 4) {
              for (let i = 0; i < t.length; i++) {
                const partial = t.slice(0, i) + t.slice(i + 1);
                if (hay.includes(partial)) { matched++; score += 1; break; }
              }
            }
          }
        }
        return { p, score, matched };
      })
      .filter(({ matched }) => matched === tokens.length)
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => p);
  }

  if (filters.intent) {
    items = items.filter((p) => p.intent === filters.intent);
  }
  if (filters.kind) {
    items = items.filter((p) => p.kind === filters.kind);
  }
  if (filters.bhk != null) {
    items = items.filter((p) => (p.bhk ?? 0) === filters.bhk);
  }
  if (typeof filters.budgetMin === "number") {
    items = items.filter((p) => p.priceInr >= filters.budgetMin!);
  }
  if (typeof filters.budgetMax === "number") {
    items = items.filter((p) => p.priceInr <= filters.budgetMax!);
  }
  if (typeof filters.areaMin === "number") {
    items = items.filter((p) => p.areaSqft >= filters.areaMin!);
  }
  if (typeof filters.areaMax === "number") {
    items = items.filter((p) => p.areaSqft <= filters.areaMax!);
  }
  if (filters.verifiedOnly) {
    items = items.filter((p) => p.verified);
  }
  if (filters.amenities.length > 0) {
    items = items.filter((p) =>
      filters.amenities.every((a) => (p.amenities ?? []).includes(a))
    );
  }
  if (filters.parking) {
    items = items.filter((p) => p.hasParking);
  }
  if (filters.furnishing) {
    items = items.filter((p) => p.furnishing === filters.furnishing);
  }
  if (filters.nearby && filters.nearby.length > 0) {
    items = items.filter((p) =>
      filters.nearby!.every((kind) => (p.nearbyKm?.[kind] ?? 99) <= 1.5)
    );
  }
  if (typeof filters.radiusKm === "number") {
    items = items.filter((p) => p.distanceKm <= filters.radiusKm!);
  }

  // 2. Sort
  switch (filters.sort) {
    case "price-asc":
      items.sort((a, b) => a.priceInr - b.priceInr);
      break;
    case "price-desc":
      items.sort((a, b) => b.priceInr - a.priceInr);
      break;
    case "distance":
      items.sort((a, b) => a.distanceKm - b.distanceKm);
      break;
    case "trust":
      items.sort((a, b) => b.trustScore - a.trustScore);
      break;
    case "newest":
    default:
      items.sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      );
  }

  // 3. Paginate
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const paged = items.slice(start, start + PAGE_SIZE);

  return {
    items: paged,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    origin,
  };
}

/** Bounding box around the result set + origin (for map framing). */
export function computeBounds(
  origin: { lat: number; lng: number },
  items: { location: { coords: { lat: number; lng: number } } }[]
) {
  const lats = [origin.lat, ...items.map((i) => i.location.coords.lat)];
  const lngs = [origin.lng, ...items.map((i) => i.location.coords.lng)];
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add padding (5%).
  const pad = 0.05;
  const dLat = Math.max(0.02, (maxLat - minLat) * pad);
  const dLng = Math.max(0.02, (maxLng - minLng) * pad);

  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLng: minLng - dLng,
    maxLng: maxLng + dLng,
  };
}
