import type { GeoPoint } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine great-circle distance between two GPS coordinates.
 * Returns kilometres. Mirrors the SQL we use in PostGIS:
 *   ST_DistanceSphere(geom_a, geom_b) / 1000.0
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Human-friendly distance label. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  if (km < 1000) return `${Math.round(km)} km`;
  return `${Math.round(km / 1000).toLocaleString("en-IN")}k km`;
}

/** Filter + sort by proximity within a radius. */
export function withinRadius<T extends { location: { coords: GeoPoint } }>(
  origin: GeoPoint,
  items: T[],
  radiusKm: number
): (T & { distanceKm: number })[] {
  return items
    .map((item) => ({
      ...item,
      distanceKm: haversineKm(origin, item.location.coords),
    }))
    .filter((item) => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
