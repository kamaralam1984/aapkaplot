import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/server/in-memory-store";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const Body = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2).max(60),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  scheduledFor: z.string().datetime().optional(),
  slot: z.string().min(1).max(20),
  note: z.string().max(500).optional(),
});

const useDb = () => process.env.USE_DB === "1";

export async function POST(req: Request) {
  const session = await getSession();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const scheduledFor = parsed.data.scheduledFor
    ? new Date(parsed.data.scheduledFor)
    : new Date(Date.now() + 86_400_000);

  if (useDb()) {
    try {
      const row = await prisma.visitRequest.create({
        data: {
          propertyId: parsed.data.propertyId,
          userId: session?.uid ?? null,
          name: parsed.data.name,
          phone: parsed.data.phone,
          slot: parsed.data.slot,
          scheduledFor,
          note: parsed.data.note ?? null,
          status: "pending",
        },
        select: { id: true, propertyId: true, slot: true, status: true, scheduledFor: true, createdAt: true },
      });
      return NextResponse.json({
        ok: true,
        visit: {
          ...row,
          scheduledFor: row.scheduledFor.toISOString(),
          createdAt: row.createdAt.toISOString(),
        },
      });
    } catch (err) {
      console.error("[visit-request] db_write_failed, falling back to memory", err);
    }
  }

  const id = `vr_${Math.random().toString(36).slice(2, 10)}`;
  const record = {
    id,
    propertyId: parsed.data.propertyId,
    slot: parsed.data.slot,
    status: "pending" as const,
    scheduledFor: scheduledFor.toISOString(),
    createdAt: new Date().toISOString(),
  };
  store.visitRequests.set(id, record);
  return NextResponse.json({ ok: true, visit: record });
}

/**
 * GET — auth-gated when DB is on (returns the user's own visits).
 * Without auth or DB, returns the local in-memory store (legacy admin/dev).
 */
export async function GET() {
  const session = await getSession();

  if (useDb() && session) {
    try {
      const rows = await prisma.visitRequest.findMany({
        where: { userId: session.uid },
        orderBy: { scheduledFor: "desc" },
        take: 100,
        select: {
          id: true, propertyId: true, slot: true, status: true,
          scheduledFor: true, createdAt: true,
          property: { select: { title: true, locality: true, city: true, coverUrl: true } },
        },
      });
      return NextResponse.json({
        visits: rows.map((r) => ({
          id: r.id,
          propertyId: r.propertyId,
          slot: r.slot,
          status: r.status,
          scheduledFor: r.scheduledFor.toISOString(),
          createdAt: r.createdAt.toISOString(),
          property: r.property,
        })),
      });
    } catch (err) {
      console.error("[visit-request] db_read_failed, falling back to memory", err);
    }
  }

  return NextResponse.json({ visits: [...store.visitRequests.values()] });
}

/**
 * PATCH /api/visit-request
 *   Body: { id, action: "reschedule"|"cancel", scheduledFor?, slot? }
 *
 * Reschedule: requires scheduledFor + slot. Status stays "pending"
 * (the seller re-confirms the new time).
 * Cancel: flips status to "cancelled". Reversible only by the owner.
 *
 * Owner-only: visitor must be the original requester.
 */
const PatchBody = z.discriminatedUnion("action", [
  z.object({
    id: z.string().min(1),
    action: z.literal("reschedule"),
    scheduledFor: z.string().datetime(),
    slot: z.string().min(1).max(20),
  }),
  z.object({
    id: z.string().min(1),
    action: z.literal("cancel"),
  }),
]);

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!useDb()) return NextResponse.json({ error: "db_disabled" }, { status: 503 });

  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.visitRequest.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, userId: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (existing.userId !== session.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (existing.status === "completed") {
    return NextResponse.json({ error: "already_completed" }, { status: 400 });
  }

  const update: { status?: string; scheduledFor?: Date; slot?: string } = {};
  if (parsed.data.action === "reschedule") {
    update.scheduledFor = new Date(parsed.data.scheduledFor);
    update.slot = parsed.data.slot;
    update.status = "pending"; // seller needs to re-confirm
  } else {
    update.status = "cancelled";
  }

  const updated = await prisma.visitRequest.update({
    where: { id: parsed.data.id },
    data: update,
    select: { id: true, status: true, scheduledFor: true, slot: true },
  });
  return NextResponse.json({
    ok: true,
    visit: {
      ...updated,
      scheduledFor: updated.scheduledFor.toISOString(),
    },
  });
}
