import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { fetchGscPerformance } from "@/lib/seo/gsc";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

/** Pull the last-28-day GSC perf snapshot and cache it on each SeoPage row. */
export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const result = await fetchGscPerformance();
  if (result.status === "notConfigured") {
    return NextResponse.json(
      { ok: false, status: "notConfigured", reason: result.reason },
      { status: 200 }, // not an HTTP error — just a configuration state
    );
  }
  if (result.status === "error") {
    return NextResponse.json(
      { ok: false, status: "error", code: result.code, message: result.message },
      { status: 200 },
    );
  }

  let matched = 0;
  for (const r of result.rows) {
    // The page URL from GSC looks like https://aapkaplot.com/seo/<slug>.
    // Map it back to the SeoPage row via the slug suffix.
    if (!SITE || !r.page.startsWith(`${SITE}/seo/`)) continue;
    const slug = r.page.slice(`${SITE}/seo/`.length);
    if (!slug) continue;
    const updated = await prisma.seoPage
      .update({
        where: { slug },
        data: {
          gscClicks: r.clicks,
          gscImpressions: r.impressions,
          gscCtr: r.ctr,
          gscPosition: r.position,
          lastGscSyncAt: new Date(),
        },
      })
      .catch(() => null);
    if (updated) matched++;
  }
  return NextResponse.json({ ok: true, matched, totalRows: result.rows.length, range: result.range });
}
