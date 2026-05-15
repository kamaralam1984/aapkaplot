/** Shared Mapbox configuration. Token is exposed publicly by design (Mapbox does URL restriction in the dashboard). */

export const MAP_DEFAULT_CENTER = { lat: 22.5535, lng: 88.3528 }; // Kolkata
export const MAP_DEFAULT_ZOOM = 11;

export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  light: "mapbox://styles/mapbox/light-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

export type MapStyleId = keyof typeof MAP_STYLES;

export function getMapboxToken() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token && process.env.NODE_ENV === "development") {
    console.warn(
      "[maps] NEXT_PUBLIC_MAPBOX_TOKEN missing — falling back to static map art."
    );
  }
  return token ?? null;
}

/** Build a static map preview URL — used for SSR property cards without JS. */
export function staticMapUrl({
  lat,
  lng,
  zoom = 12,
  width = 800,
  height = 600,
  style = "streets",
}: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  style?: MapStyleId;
}) {
  const token = getMapboxToken();
  if (!token) return null;
  const styleSlug = style === "satellite" ? "satellite-streets-v12" : "streets-v12";
  return `https://api.mapbox.com/styles/v1/mapbox/${styleSlug}/static/${lng},${lat},${zoom},0/${width}x${height}?access_token=${token}`;
}
