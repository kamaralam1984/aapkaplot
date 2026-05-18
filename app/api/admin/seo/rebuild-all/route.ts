import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { rebuildSinglePage } from "@/lib/seo/generator";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * Backfill every existing SeoPage through the latest composer + theme +
 * quality logic. Pages are processed oldest-built-first so a partial run
 * still makes forward progress.
 *
 * Query params:
 *   limit=<int>    cap on rows updated per call (default 100, max 500)
 */
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));

  const rows = await prisma.seoPage.findMany({
    select: { id: true, slug: true },
    orderBy: { lastBuiltAt: "asc" },
    take: limit,
  });

  let published = 0, rejected = 0, errored = 0;
  const sample: { slug: string; score: number; reasons: string[] }[] = [];
  const start = Date.now();

  for (const r of rows) {
    try {
      const result = await rebuildSinglePage(r.id);
      if (result.published) published++;
      else {
        rejected++;
        if (sample.length < 5) sample.push({ slug: r.slug, score: result.score, reasons: result.reasons });
      }
    } catch {
      errored++;
    }
  }

  return NextResponse.json({
    ok: true,
    attempted: rows.length,
    published,
    rejected,
    errored,
    durationMs: Date.now() - start,
    sampleRejections: sample,
  });
}
