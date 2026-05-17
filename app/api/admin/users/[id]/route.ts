import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

const PatchBody = z.object({
  name: z.string().min(1).max(60).nullable().optional(),
  role: z.enum(["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  suspended: z.boolean().optional(),
  phone: z.string().min(5).max(30).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Promoting to ADMIN or SUPER_ADMIN is reserved for SUPER_ADMIN only;
  // regular ADMINs can manage non-admin users but cannot create more admins.
  const wantsPrivilegeChange = parsed.data.role === "ADMIN" || parsed.data.role === "SUPER_ADMIN";
  const guard = wantsPrivilegeChange ? await requireSuperAdmin() : await requireAdmin();
  if (!guard.ok) return guard.res;

  // Prevent self-demotion or self-suspend lockout.
  if (id === guard.session.uid) {
    if (parsed.data.suspended === true) {
      return NextResponse.json({ error: "cannot_suspend_self" }, { status: 400 });
    }
    if (parsed.data.role && parsed.data.role !== "SUPER_ADMIN" && parsed.data.role !== "ADMIN") {
      return NextResponse.json({ error: "cannot_demote_self" }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, email: true, role: true, suspended: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    return NextResponse.json({ error: "not_found_or_db_error", message: (e as Error).message }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.res;

  const { id } = await ctx.params;
  if (id === guard.session.uid) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "not_found_or_db_error", message: (e as Error).message }, { status: 404 });
  }
}
