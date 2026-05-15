import { prisma } from "@/server/db";
import type { Property } from "@/lib/types";

/**
 * Nearby property search using PostGIS ST_DistanceSphere.
 *
 * SQL:
 *   SELECT *, ST_DistanceSphere(geom, ST_MakePoint(:lng, :lat)) / 1000 AS distance_km
 *   FROM "Property"
 *   WHERE status = 'ACTIVE'
 *     AND ST_DistanceSphere(geom, ST_MakePoint(:lng, :lat)) <= :radius_m
 *   ORDER BY distance_km ASC
 *   LIMIT :limit;
 *
 * Requires the GIST index:
 *   CREATE INDEX property_geom_idx ON "Property" USING GIST (geom);
 */
export interface NearbyOptions {
  lat: number;
  lng: number;
  radiusKm: number;
  limit?: number;
  kind?: string;
  intent?: string;
  priceMin?: number;
  priceMax?: number;
}

export async function findNearbyProperties(opts: NearbyOptions) {
  const limit = Math.min(opts.limit ?? 24, 100);
  const radiusM = opts.radiusKm * 1000;

  // Build dynamic filters as fragments to keep query parametrised.
  const filters: string[] = [`p.status = 'ACTIVE'`];
  const params: unknown[] = [opts.lng, opts.lat, radiusM, limit];
  const next = () => `$${params.length}`;

  if (opts.kind) {
    params.push(opts.kind);
    filters.push(`p.kind = ${next()}::"PropertyKind"`);
  }
  if (opts.intent) {
    params.push(opts.intent);
    filters.push(`p.intent = ${next()}::"ListingIntent"`);
  }
  if (typeof opts.priceMin === "number") {
    params.push(opts.priceMin);
    filters.push(`p."priceInr" >= ${next()}`);
  }
  if (typeof opts.priceMax === "number") {
    params.push(opts.priceMax);
    filters.push(`p."priceInr" <= ${next()}`);
  }

  const sql = `
    SELECT
      p.*,
      ST_DistanceSphere(p.geom, ST_MakePoint($1, $2)) / 1000.0 AS distance_km
    FROM "Property" p
    WHERE ${filters.join(" AND ")}
      AND ST_DistanceSphere(p.geom, ST_MakePoint($1, $2)) <= $3
    ORDER BY distance_km ASC
    LIMIT $4;
  `;

  // Cast to unknown first, app maps to the public Property type.
  return prisma.$queryRawUnsafe<Property[]>(sql, ...params);
}

/** Keep the geog column in sync whenever lat/lng changes. Call after writes. */
export async function syncGeom(propertyId: string) {
  await prisma.$executeRaw`
    UPDATE "Property"
    SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    WHERE id = ${propertyId};
  `;
}
