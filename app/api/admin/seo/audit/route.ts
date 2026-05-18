import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { auditSlug } from "@/lib/seo/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Scan every SeoPage slug, flag spammy patterns into the qualityFlags array. */
export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const pages = await prisma.seoPage.findMany({ select: { id: true, slug: true } });
  let flagged = 0;
  let cleared = 0;
  const flagCounts: Record<string, number> = {};

  for (const p of pages) {
    const flags = auditSlug(p.slug);
    if (flags.length) {
      flagged++;
      for (const f of flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
    } else {
      cleared++;
    }
    await prisma.seoPage.update({ where: { id: p.id }, data: { qualityFlags: flags } });
  }
  return NextResponse.json({ ok: true, scanned: pages.length, flagged, cleared, byFlag: flagCounts });
}
