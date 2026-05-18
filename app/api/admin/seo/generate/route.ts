import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { runGeneration, MAX_PER_RUN } from "@/lib/seo/generator";
import { pingIndexNow } from "@/lib/seo/indexnow";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Manual trigger — mirrors the cron handler, gated by admin auth. */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const limit = Math.min(MAX_PER_RUN, Math.max(1, Number(url.searchParams.get("limit")) || MAX_PER_RUN));

  const result = await runGeneration(limit);

  // Same IndexNow ping the cron does, when configured.
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  let indexNow: { ok: boolean; status: number; pinged: number } = { ok: false, status: 0, pinged: 0 };
  if (site && result.publishedSlugs.length) {
    const urls = result.publishedSlugs.map((s) => `${site}/seo/${s}`);
    indexNow = await pingIndexNow(urls);
    if (indexNow.ok) {
      await prisma.seoPage.updateMany({
        where: { slug: { in: result.publishedSlugs } },
        data: { lastIndexedAt: new Date() },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    attempted: result.attempted,
    published: result.published,
    rejected: result.rejected,
    skipped: result.skipped,
    durationMs: result.durationMs,
    indexNow,
    sampleRejections: result.rejections.slice(0, 10),
  });
}
