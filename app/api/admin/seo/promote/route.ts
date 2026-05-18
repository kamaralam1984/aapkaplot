import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Forcefully publish REJECTED rows, sorted by quality desc.
 *
 * Query params:
 *   count=<number>       max rows to promote (default: 500; cap: 5000)
 *   minScore=<0-100>     don't promote anything below this (default: 50)
 *
 * This bypasses the strict 70+ quality gate but enforces a softer floor
 * so truly broken pages (score < 50) never reach the index.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const count = Math.max(1, Math.min(5000, Number(url.searchParams.get("count")) || 500));
  const minScore = Math.max(0, Math.min(100, Number(url.searchParams.get("minScore")) || 50));

  const candidates = await prisma.seoPage.findMany({
    where: { status: "REJECTED", qualityScore: { gte: minScore } },
    select: { id: true, publishedAt: true },
    orderBy: { qualityScore: "desc" },
    take: count,
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, promoted: 0, message: "No rejected rows meet the minimum score." });
  }

  // batch update is faster but loses per-row publishedAt initialisation; for
  // ≤500 rows, the per-row update is acceptable and gives correct timestamps.
  for (const c of candidates) {
    await prisma.seoPage.update({
      where: { id: c.id },
      data: { status: "PUBLISHED", publishedAt: c.publishedAt ?? new Date() },
    });
  }
  return NextResponse.json({ ok: true, promoted: candidates.length, minScore });
}
