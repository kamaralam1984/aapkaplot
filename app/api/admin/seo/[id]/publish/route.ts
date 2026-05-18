import { NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const existing = await prisma.seoPage.findUnique({
    where: { id },
    select: { qualityScore: true, wordCount: true, status: true, publishedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Don't accidentally publish something that never passed the gate.
  if (existing.qualityScore < 70 || existing.wordCount < 800) {
    return NextResponse.json(
      { error: `Quality too low to publish (score ${existing.qualityScore}, words ${existing.wordCount}). Rebuild or Improve first.` },
      { status: 400 },
    );
  }

  const row = await prisma.seoPage.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt ?? new Date(),
    },
    select: { id: true, slug: true, status: true },
  });

  return NextResponse.json({ ok: true, slug: row.slug, status: row.status });
}
