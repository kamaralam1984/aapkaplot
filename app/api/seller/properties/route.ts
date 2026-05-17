import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ properties: [], mode: "db_disabled" });

/**
 * GET /api/seller/properties
 *
 * Returns all listings owned by the current user, newest first. Used by
 * /sell/listings to populate the table with real data.
 */
export async function GET() {
  if (process.env.USE_DB !== "1") return dbOff();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const rows = await prisma.property.findMany({
    where: { ownerId: session.uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      kind: true,
      intent: true,
      status: true,
      priceInr: true,
      areaSqft: true,
      locality: true,
      city: true,
      verified: true,
      featuredUntil: true,
      boostedUntil: true,
      createdAt: true,
    },
  });

  // Postgres COUNT for leads per property — issued separately so we don't
  // pull the entire relation. Cheap with the indexed FK.
  const leadCounts = await prisma.lead.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: rows.map((r) => r.id) } },
    _count: { _all: true },
  });
  const leadMap = new Map(leadCounts.map((l) => [l.propertyId, l._count._all]));

  const properties = rows.map((r) => ({
    id: r.id,
    title: r.title,
    coverUrl: r.coverUrl,
    kind: r.kind,
    intent: r.intent,
    status: r.status,
    priceInr: r.priceInr,
    areaSqft: r.areaSqft,
    locality: r.locality,
    city: r.city,
    verified: r.verified,
    featuredUntil: r.featuredUntil?.toISOString() ?? null,
    boostedUntil: r.boostedUntil?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    leadsCount: leadMap.get(r.id) ?? 0,
  }));

  return NextResponse.json({ properties, mode: "live" });
}

/**
 * POST /api/seller/properties  — quick status flip (pause / resume).
 * Body: { id: string, action: "pause" | "resume" }
 *
 * Lives here (not on the /[id] route) so seller dashboards can hit one
 * URL for any of their listings. Owner-only.
 */
const ActionBody = z.object({
  id: z.string().min(1),
  action: z.enum(["pause", "resume"]),
});

export async function POST(req: Request) {
  if (process.env.USE_DB !== "1") return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = ActionBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const existing = await prisma.property.findUnique({
    where: { id: parsed.data.id },
    select: { ownerId: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (existing.ownerId !== session.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const nextStatus = parsed.data.action === "pause" ? "PAUSED" : "ACTIVE";
  const updated = await prisma.property.update({
    where: { id: parsed.data.id },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });
  return NextResponse.json({ ok: true, property: updated });
}
