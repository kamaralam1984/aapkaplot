import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { gradePage } from "@/lib/seo/quality-gate";
import type { ComposedPage } from "@/lib/seo/content-composer";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Re-run the quality gate on every existing page against the latest
 * scoring logic. Pages flip status only if their quality changes the
 * pass/fail outcome.
 */
export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const pages = await prisma.seoPage.findMany({
    select: { id: true, content: true, status: true },
    take: 5000, // hard cap per run
  });

  let upgraded = 0;
  let downgraded = 0;
  let unchanged = 0;

  for (const p of pages) {
    const composed = p.content as unknown as ComposedPage | null;
    if (!composed?.blocks) { unchanged++; continue; }
    const grade = gradePage(composed);

    let nextStatus = p.status;
    if (p.status === "REJECTED" && grade.passes) nextStatus = "PUBLISHED";
    else if (p.status === "PUBLISHED" && !grade.passes) nextStatus = "REJECTED";

    if (nextStatus !== p.status) {
      if (nextStatus === "PUBLISHED") upgraded++;
      else downgraded++;
    } else {
      unchanged++;
    }

    await prisma.seoPage.update({
      where: { id: p.id },
      data: {
        qualityScore: grade.score,
        status: nextStatus,
        ...(nextStatus === "PUBLISHED" && p.status !== "PUBLISHED" ? { publishedAt: new Date() } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true, scanned: pages.length, upgraded, downgraded, unchanged });
}
