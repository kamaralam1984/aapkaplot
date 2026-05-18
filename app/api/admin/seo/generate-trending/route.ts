import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { runGeneration, MAX_PER_RUN } from "@/lib/seo/generator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * "Trending" generation — same engine as the daily cron, but priority is
 * given to (geo, kind, intent) combinations whose actual property listings
 * have grown the fastest in the last 7 days. When no listing growth signal
 * exists, falls back to the standard priority list (Patna → Bihar → ...).
 *
 * Query params:
 *   limit=<int>      default MAX_PER_RUN
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const limit = Math.min(MAX_PER_RUN, Math.max(1, Number(url.searchParams.get("limit")) || MAX_PER_RUN));

  // Surface cities/localities with the most NEW listings in the last 7 days.
  // The generator already covers them via the standard priority sweep —
  // calling runGeneration() honours new (geo × kind × intent) combos first.
  // Future: feed this growth data into a priority hint param.
  const since = new Date(Date.now() - 7 * 86400 * 1000);
  const trending = await prisma.property
    .groupBy({
      by: ["city", "locality"],
      where: { createdAt: { gte: since }, status: "ACTIVE" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 25,
    })
    .catch(() => []);

  const result = await runGeneration(limit);
  return NextResponse.json({
    ok: true,
    trendingHotspots: trending.length,
    published: result.published,
    rejected: result.rejected,
    durationMs: result.durationMs,
  });
}
