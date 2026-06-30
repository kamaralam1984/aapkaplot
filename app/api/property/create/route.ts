import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { syncGeom } from "@/server/property/geo";
import { CITY_CENTROIDS, DEFAULT_CENTROID } from "@/lib/city-centroids";
import { computeTrustScore } from "@/lib/trust-score";

export const runtime = "nodejs";

const PHOTO = z.object({ name: z.string().min(1), url: z.string().min(1) });

const Body = z.object({
  intent: z.enum(["buy", "rent", "sell"]),
  kind: z.enum(["plot", "flat", "house", "villa", "shop", "office", "warehouse", "agriculture"]),
  title: z.string().min(6).max(300),
  description: z.string().max(4000).optional().default(""),
  bhk: z.number().int().min(1).max(20).optional(),
  areaSqft: z.number().int().min(50).max(1_000_000).optional(),
  furnishing: z.enum(["Unfurnished", "Semi-furnished", "Furnished"]).optional(),
  locality: z.string().min(1).max(100),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal("")),
  amenities: z.array(z.string().min(1).max(40)).max(40).default([]),
  photos: z.array(PHOTO).min(1).max(20),
  youtubeUrl: z.string().url().max(500).optional(),
  tourUrl: z.string().url().max(500).optional(),
  priceInr: z.number().int().min(1000),
  negotiable: z.boolean().optional().default(true),
  allowsBrokers: z.boolean().optional().default(false),
  brokerCommissionPct: z.number().min(0.5).max(5).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  roadEastFt:  z.number().int().min(0).max(500).optional(),
  roadWestFt:  z.number().int().min(0).max(500).optional(),
  roadNorthFt: z.number().int().min(0).max(500).optional(),
  roadSouthFt: z.number().int().min(0).max(500).optional(),
  /** Optional plot/compound polygon as a GeoJSON ring of [lng, lat] pairs.
   *  Validated as ≥ 3 vertices; the closing vertex is added server-side. */
  boundary: z
    .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
    .min(3)
    .max(64)
    .optional(),
});

function toEnumKind(k: z.infer<typeof Body>["kind"]) {
  return k.toUpperCase() as "PLOT" | "FLAT" | "HOUSE" | "VILLA" | "SHOP" | "OFFICE" | "WAREHOUSE" | "AGRICULTURE";
}
function toEnumIntent(i: z.infer<typeof Body>["intent"]) {
  return (i === "buy" ? "SELL" : i.toUpperCase()) as "SELL" | "RENT" | "BUY";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (process.env.USE_DB !== "1") {
    return NextResponse.json(
      { error: "db_disabled", hint: "Set USE_DB=1 and run docker compose up -d postgres" },
      { status: 503 }
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Resolve geo: explicit lat/lng wins, else city centroid, else India centroid.
  const centroid = CITY_CENTROIDS[d.city.trim().toLowerCase()] ?? DEFAULT_CENTROID;
  const lat = d.lat ?? centroid.lat;
  const lng = d.lng ?? centroid.lng;

  const [cover, ...rest] = d.photos;

  const owner = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { aadhaarVerified: true },
  }).catch(() => null);

  const trustScore = computeTrustScore({
    ownerAadhaarVerified: !!owner?.aadhaarVerified,
    adminVerified: false,
    coverUrl: cover.url,
    galleryCount: rest.length,
    hasVideo: false,
    hasYoutube: !!d.youtubeUrl,
    hasTour: !!d.tourUrl,
    hasBoundary: !!d.boundary,
    descriptionLength: (d.description || "").length,
    hasCoords: d.lat != null && d.lng != null,
    hasPincode: !!d.pincode,
    amenitiesCount: d.amenities.length,
    priceInr: d.priceInr,
    areaSqft: d.areaSqft ?? 0,
    bhk: d.bhk ?? null,
    kind: d.kind,
  });

  try {
    const created = await prisma.property.create({
      data: {
        title: d.title.trim(),
        description: d.description || null,
        kind: toEnumKind(d.kind),
        intent: toEnumIntent(d.intent),
        status: "PENDING_REVIEW",
        priceInr: d.priceInr,
        areaSqft: d.areaSqft ?? 0,
        bhk: d.bhk ?? null,
        locality: d.locality.trim(),
        city: d.city.trim(),
        state: d.state.trim(),
        pincode: d.pincode || null,
        lat,
        lng,
        coverUrl: cover.url,
        gallery: rest.map((p) => p.url),
        youtubeUrl: d.youtubeUrl ?? null,
        tourUrl: d.tourUrl ?? null,
        amenities: d.amenities,
        aiBadges: [],
        trustScore,
        allowsBrokers: d.allowsBrokers ?? false,
        brokerCommissionPct: d.brokerCommissionPct ?? null,
        ownerId: session.uid,
        boundary: d.boundary ? (d.boundary as unknown as object) : undefined,
        roadEastFt:  d.roadEastFt  ?? null,
        roadWestFt:  d.roadWestFt  ?? null,
        roadNorthFt: d.roadNorthFt ?? null,
        roadSouthFt: d.roadSouthFt ?? null,
      },
      select: { id: true, status: true, createdAt: true },
    });

    // Keep PostGIS geog column in sync (used by nearby search).
    try {
      await syncGeom(created.id);
    } catch (err) {
      console.error("[property/create] syncGeom_failed", created.id, err);
    }

    return NextResponse.json({ ok: true, id: created.id, status: created.status }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create_failed";
    console.error("[property/create] failed", err);
    return NextResponse.json({ error: "create_failed", message: msg }, { status: 500 });
  }
}
