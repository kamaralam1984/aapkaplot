import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ items: [], mode: "db_off" });

/**
 * GET /api/admin/moderation?status=open|approved|rejected
 *
 * Returns the live moderation queue from the DB:
 *   - status=open  -> Property.status = PENDING_REVIEW
 *   - approved     -> Property.status = ACTIVE (recently flipped)
 *   - rejected     -> Property.status = REJECTED
 *
 * Each row is enriched with the owner's name + first cover URL so the admin
 * UI can render a card without extra round-trips.
 */
const QuerySchema = z.object({
  status: z.enum(["open", "approved", "rejected"]).default("open"),
});

const PRISMA_STATUS = {
  open: "PENDING_REVIEW",
  approved: "ACTIVE",
  rejected: "REJECTED",
} as const;

export async function GET(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ status: url.searchParams.get("status") ?? "open" });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const rows = await prisma.property.findMany({
    where: { status: PRISMA_STATUS[parsed.data.status] },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      coverUrl: true,
      locality: true,
      city: true,
      priceInr: true,
      kind: true,
      trustScore: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  // Derive a simple severity + reason from the row itself. No fake reasons —
  // we surface whichever signal the listing actually fails on.
  const items = rows.map((p) => {
    let severity: "low" | "medium" | "high" = "low";
    let reason = "Pending admin review";
    if (p.trustScore < 30) {
      severity = "high";
      reason = "Low trust score";
    } else if (!p.verified) {
      severity = "medium";
      reason = "Owner not yet verified";
    } else if (p.trustScore < 60) {
      severity = "medium";
      reason = "Borderline trust score";
    }
    return {
      id: p.id,
      propertyId: p.id,
      title: p.title,
      coverUrl: p.coverUrl,
      locality: p.locality,
      city: p.city,
      priceInr: p.priceInr,
      kind: p.kind,
      trustScore: p.trustScore,
      verified: p.verified,
      ownerName: p.owner?.name ?? null,
      ownerEmail: p.owner?.email ?? null,
      severity,
      reason,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ items, mode: "live" });
}

/**
 * PATCH /api/admin/moderation  — approve or reject a listing.
 * Body: { id: string, decision: "approve" | "reject" }
 */
const PatchBody = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
});

export async function PATCH(req: Request) {
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  }
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const nextStatus = parsed.data.decision === "approve" ? "ACTIVE" : "REJECTED";
  try {
    const updated = await prisma.property.update({
      where: { id: parsed.data.id },
      data: { status: nextStatus },
      select: { id: true, status: true },
    });
    return NextResponse.json({ ok: true, property: updated });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    console.error("[admin/moderation] update_failed", err);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
