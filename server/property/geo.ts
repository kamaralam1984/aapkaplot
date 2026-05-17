import { prisma } from "@/server/db";
import type { Property } from "@/lib/types";

/**
 * Nearby property search using PostGIS.
 *
 * `Property.geom` is typed as `geography(Point,4326)` in the schema, so we
 * use ST_Distance(geography, geography) which returns *meters on the
 * spheroid* — equivalent to ST_DistanceSphere but with the right type
 * signature. (ST_DistanceSphere requires geometry inputs and would error
 * with "function st_distancesphere(geography, geometry) does not exist".)
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

  // Geography-typed distance — returns meters on the spheroid.
  // Explicit column list (no `p.*`) so Prisma doesn't try to deserialize the
  // Unsupported `geom` column.
  const sql = `
    SELECT
      p.id, p.title, p.description, p.kind, p.intent, p.status,
      p."priceInr", p."previousPriceInr", p."areaSqft", p.bhk,
      p.locality, p.city, p.state, p.pincode,
      p.lat, p.lng,
      p."coverUrl", p.gallery, p."videoUrl", p."youtubeUrl", p."tourUrl",
      p."panoFrames", p."satelliteUrl",
      p.verified, p."trustScore", p.amenities, p."aiBadges",
      p."featuredUntil", p."boostedUntil",
      p."allowsBrokers", p."brokerCommissionPct",
      p."projectId", p."ownerId",
      p."createdAt", p."updatedAt",
      ST_Distance(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS distance_km
    FROM "Property" p
    WHERE ${filters.join(" AND ")}
      AND p.geom IS NOT NULL
      AND ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
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
