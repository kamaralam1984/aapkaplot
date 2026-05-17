import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin-guard";
import { recordAudit, type AuditAction } from "@/lib/audit";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

const PatchBody = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "SOLD", "REJECTED"]).optional(),
  verified: z.boolean().optional(),
  trustScore: z.number().int().min(0).max(100).optional(),
  priceInr: z.number().int().positive().optional(),
  areaSqft: z.number().int().positive().optional(),
  bhk: z.number().int().min(0).max(20).nullable().optional(),
  city: z.string().min(1).max(60).optional(),
  locality: z.string().min(1).max(80).optional(),
  state: z.string().min(1).max(60).optional(),
  pincode: z.string().max(10).nullable().optional(),
  featuredUntil: z.string().datetime().nullable().optional(),
  allowsBrokers: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { id } = await ctx.params;
  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        featuredUntil: data.featuredUntil === undefined ? undefined : data.featuredUntil === null ? null : new Date(data.featuredUntil),
      },
      select: { id: true, status: true, verified: true, title: true },
    });

    // Pick the most specific audit action for the change so the activity feed
    // reads naturally (Approve vs generic update).
    let action: AuditAction = "property.update";
    if (data.status === "ACTIVE") action = "property.approve";
    else if (data.status === "REJECTED") action = "property.reject";
    else if (data.status === "PAUSED") action = "property.pause";
    else if (data.verified === true && data.status === undefined) action = "property.verify";
    void recordAudit(guard.session, action, "property", id, data as Record<string, unknown>);

    return NextResponse.json({ ok: true, property: updated });
  } catch (e) {
    return NextResponse.json({ error: "not_found_or_db_error", message: (e as Error).message }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();
  // Destructive — restrict to SUPER_ADMIN only.
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.res;

  const { id } = await ctx.params;
  try {
    const before = await prisma.property.findUnique({
      where: { id },
      select: { title: true, status: true, ownerId: true },
    });
    await prisma.property.delete({ where: { id } });
    void recordAudit(guard.session, "property.delete", "property", id, before ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "not_found_or_db_error", message: (e as Error).message }, { status: 404 });
  }
}
