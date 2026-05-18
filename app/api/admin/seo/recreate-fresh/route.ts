import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { runGeneration, MAX_PER_RUN } from "@/lib/seo/generator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Wipe pages older than `olderThanDays` (default 90) and immediately run a
 * fresh generation to fill the space. Useful for content that has drifted
 * from current listings or POI snapshots.
 *
 * Query params:
 *   olderThanDays=<int>   default 90
 *   limit=<int>           cap on new generation (default MAX_PER_RUN)
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const olderThanDays = Math.max(7, Math.min(365, Number(url.searchParams.get("olderThanDays")) || 90));
  const limit = Math.min(MAX_PER_RUN, Math.max(1, Number(url.searchParams.get("limit")) || MAX_PER_RUN));

  const cutoff = new Date(Date.now() - olderThanDays * 86400 * 1000);
  const deleted = await prisma.seoPage.deleteMany({ where: { lastBuiltAt: { lt: cutoff } } });

  const result = await runGeneration(limit);
  return NextResponse.json({
    ok: true,
    deletedStale: deleted.count,
    fresh: { attempted: result.attempted, published: result.published, rejected: result.rejected },
  });
}
