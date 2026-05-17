import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { syncGeom } from "@/server/property/geo";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

/**
 * GET /api/seller/property/[id]
 *
 * Returns one listing iff the caller owns it. Used to hydrate the edit
 * form. Includes the same fields the create endpoint accepts so the
 * round-trip is symmetric.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const p = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true, ownerId: true, status: true,
      kind: true, intent: true, title: true, description: true,
      bhk: true, areaSqft: true,
      locality: true, city: true, state: true, pincode: true,
      lat: true, lng: true, boundary: true,
      coverUrl: true, gallery: true, youtubeUrl: true, tourUrl: true,
      amenities: true, priceInr: true,
      allowsBrokers: true, brokerCommissionPct: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (p.ownerId !== session.uid) {
    const me = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true } });
    if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  return NextResponse.json({ property: p });
}

/**
 * PATCH /api/seller/property/[id]
 *
 * Owner-only edit. Accepts the same shape as POST /api/property/create
 * (minus the photos requirement — gallery can be partially updated).
 * On success returns the updated row. Re-syncs PostGIS geom whenever
 * lat/lng change.
 */
const PHOTO = z.object({ name: z.string().min(1), url: z.string().min(1) });
const Body = z.object({
  intent: z.enum(["buy", "rent", "sell"]).optional(),
  kind: z.enum(["plot", "flat", "house", "villa", "shop", "office", "warehouse", "agriculture"]).optional(),
  title: z.string().min(6).max(120).optional(),
  description: z.string().max(4000).optional(),
  bhk: z.number().int().min(1).max(20).optional(),
  areaSqft: z.number().int().min(50).max(1_000_000).optional(),
  furnishing: z.enum(["Unfurnished", "Semi-furnished", "Furnished"]).optional(),
  locality: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(80).optional(),
  state: z.string().min(1).max(80).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal("")),
  amenities: z.array(z.string().min(1).max(40)).max(40).optional(),
  photos: z.array(PHOTO).min(1).max(20).optional(),
  youtubeUrl: z.string().url().max(500).optional().or(z.literal("")),
  tourUrl: z.string().url().max(500).optional().or(z.literal("")),
  priceInr: z.number().int().min(1000).optional(),
  negotiable: z.boolean().optional(),
  allowsBrokers: z.boolean().optional(),
  brokerCommissionPct: z.number().min(0.5).max(5).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  boundary: z
    .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
    .min(3)
    .max(64)
    .optional(),
});

function toEnumKind(k: NonNullable<z.infer<typeof Body>["kind"]>) {
  return k.toUpperCase() as "PLOT" | "FLAT" | "HOUSE" | "VILLA" | "SHOP" | "OFFICE" | "WAREHOUSE" | "AGRICULTURE";
}
function toEnumIntent(i: NonNullable<z.infer<typeof Body>["intent"]>) {
  return (i === "buy" ? "SELL" : i.toUpperCase()) as "SELL" | "RENT" | "BUY";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.property.findUnique({ where: { id }, select: { ownerId: true, lat: true, lng: true } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Owner OR admin can edit. Admins editing on behalf of a seller is the path
  // used by /admin/properties/edit/[id].
  if (existing.ownerId !== session.uid) {
    const me = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true } });
    if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (d.intent)      updateData.intent = toEnumIntent(d.intent);
  if (d.kind)        updateData.kind = toEnumKind(d.kind);
  if (d.title)       updateData.title = d.title.trim();
  if (d.description !== undefined) updateData.description = d.description || null;
  if (d.bhk !== undefined)      updateData.bhk = d.bhk;
  if (d.areaSqft !== undefined) updateData.areaSqft = d.areaSqft;
  if (d.locality) updateData.locality = d.locality.trim();
  if (d.city)     updateData.city     = d.city.trim();
  if (d.state)    updateData.state    = d.state.trim();
  if (d.pincode !== undefined) updateData.pincode = d.pincode || null;
  if (d.amenities) updateData.amenities = d.amenities;
  if (d.photos && d.photos.length > 0) {
    const [cover, ...rest] = d.photos;
    updateData.coverUrl = cover.url;
    updateData.gallery = rest.map((p) => p.url);
  }
  if (d.youtubeUrl !== undefined) updateData.youtubeUrl = d.youtubeUrl || null;
  if (d.tourUrl !== undefined)    updateData.tourUrl = d.tourUrl || null;
  if (d.priceInr !== undefined)   updateData.priceInr = d.priceInr;
  if (d.allowsBrokers !== undefined) updateData.allowsBrokers = d.allowsBrokers;
  if (d.brokerCommissionPct !== undefined) updateData.brokerCommissionPct = d.brokerCommissionPct;
  if (d.lat !== undefined) updateData.lat = d.lat;
  if (d.lng !== undefined) updateData.lng = d.lng;
  if (d.boundary !== undefined) updateData.boundary = d.boundary as unknown as object;

  // Edits put the listing back into review unless caller is a verified
  // straight-edit (only photos/desc) — keep it strict for now.
  updateData.status = "PENDING_REVIEW";

  try {
    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
      select: { id: true, status: true, lat: true, lng: true, updatedAt: true },
    });
    if (d.lat !== undefined || d.lng !== undefined) {
      try {
        await syncGeom(updated.id);
      } catch (err) {
        console.error("[seller/property/PATCH] syncGeom_failed", updated.id, err);
      }
    }
    return NextResponse.json({ ok: true, property: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "update_failed";
    console.error("[seller/property/PATCH] failed", err);
    return NextResponse.json({ error: "update_failed", message: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/seller/property/[id]
 * Soft-delete: flips status to REJECTED so the row stays for audit but
 * disappears from public lists. A future cron can hard-delete after 30 d.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.property.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (existing.ownerId !== session.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.property.update({ where: { id }, data: { status: "REJECTED" } });
  return NextResponse.json({ ok: true });
}
