/**
 * Daily SEO-page generation cron endpoint.
 *
 * Trigger options (no preference enforced):
 *   • Vercel Cron — add to vercel.json
 *   • PM2 cron on VPS — see deploy/ecosystem.config.cjs
 *   • External cron-job.org — POST/GET with the secret header
 *
 * Auth: CRON_SECRET in either the `x-cron-secret` header or
 * `?key=` query string. Returns 401 otherwise.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { runGeneration, MAX_PER_RUN } from "@/lib/seo/generator";
import { pingIndexNow } from "@/lib/seo/indexnow";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — typical run takes 2–3 min for 100 pages

function isAuthed(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret");
  const query = req.nextUrl.searchParams.get("key");
  const vercel = req.headers.get("authorization") === `Bearer ${secret}`;
  return header === secret || query === secret || vercel;
}

async function handle(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit") || MAX_PER_RUN);
  const limit = Math.min(MAX_PER_RUN, Math.max(1, limitParam || MAX_PER_RUN));

  const result = await runGeneration(limit);

  // IndexNow ping for newly-published pages (free, instant)
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
    sampleRejections: result.rejections.slice(0, 5),
  });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
