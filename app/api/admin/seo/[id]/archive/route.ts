import { NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const row = await prisma.seoPage.update({
    where: { id },
    data: { status: "ARCHIVED" },
    select: { id: true, slug: true, status: true },
  }).catch(() => null);

  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, slug: row.slug });
}
