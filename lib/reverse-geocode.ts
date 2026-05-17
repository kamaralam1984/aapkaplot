/**
 * Reverse geocoder backed by Nominatim (OpenStreetMap). Free, no key,
 * 1 req/sec policy — we cache results in localStorage on the client and
 * in a Map server-side so we stay well under that.
 *
 * Returns the best human-readable place name for given coordinates.
 */

export interface ResolvedPlace {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  source: "nominatim" | "cache" | "fallback";
}

const SERVER_CACHE = new Map<string, { at: number; place: ResolvedPlace }>();
const TTL_MS = 24 * 60 * 60 * 1000;

function cacheKey(lat: number, lng: number) {
  // 3 decimals ≈ 111 m precision, good enough for "what city am I in".
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ResolvedPlace> {
  const key = cacheKey(lat, lng);
  const hit = SERVER_CACHE.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return { ...hit.place, source: "cache" };
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}&format=jsonv2&zoom=10&accept-language=en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AapKaPlot/1.0 (reverse-geocode)" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const data = (await res.json()) as {
      address?: {
        city?: string; town?: string; village?: string; suburb?: string;
        state_district?: string; state?: string; country?: string;
      };
    };
    const a = data.address ?? {};
    const place: ResolvedPlace = {
      city: a.city ?? a.town ?? a.village ?? a.state_district ?? a.suburb ?? "Unknown",
      state: a.state ?? "",
      country: a.country ?? "India",
      lat, lng,
      source: "nominatim",
    };
    SERVER_CACHE.set(key, { at: Date.now(), place });
    return place;
  } catch {
    return { city: "Unknown", state: "", country: "India", lat, lng, source: "fallback" };
  }
}
