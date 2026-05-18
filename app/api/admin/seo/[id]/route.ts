import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/** DELETE — super-admin only (destructive). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin({ superOnly: true });
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const row = await prisma.seoPage.delete({
    where: { id },
    select: { slug: true },
  }).catch(() => null);

  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, slug: row.slug });
}
