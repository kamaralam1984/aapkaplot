import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { improveSinglePage } from "@/lib/seo/generator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Bulk action — pick up to MAX_BATCH rejected rows and run improve() on each.
 *  Pages that still fail stay REJECTED. */
const MAX_BATCH = 50;

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const rejected = await prisma.seoPage.findMany({
    where: { status: "REJECTED" },
    select: { id: true, slug: true },
    orderBy: { lastBuiltAt: "asc" },
    take: MAX_BATCH,
  });

  let published = 0;
  let stillRejected = 0;
  const sample: { slug: string; score: number; reasons: string[] }[] = [];

  for (const r of rejected) {
    try {
      const result = await improveSinglePage(r.id);
      if (result.published) published++;
      else {
        stillRejected++;
        if (sample.length < 5) sample.push({ slug: r.slug, score: result.score, reasons: result.reasons });
      }
    } catch {
      stillRejected++;
    }
  }

  return NextResponse.json({
    ok: true,
    attempted: rejected.length,
    published,
    rejected: stillRejected,
    sampleRejections: sample,
  });
}
