import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/lib/admin-guard";
import { fetchPageSpeed } from "@/lib/pagespeed";

export const runtime = "nodejs";
export const maxDuration = 120; // PageSpeed can be slow

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

const Body = z.object({
  url: z.string().url().optional(),
  strategy: z.enum(["mobile", "desktop", "both"]).default("both"),
});

export async function POST(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const target =
    parsed.data.url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

  const strategies =
    parsed.data.strategy === "both" ? (["mobile", "desktop"] as const) : [parsed.data.strategy];

  const results: unknown[] = [];
  for (const strategy of strategies) {
    try {
      const s = await fetchPageSpeed(target, strategy);
      const row = await prisma.performanceScan.create({
        data: {
          url: s.url,
          strategy: s.strategy,
          performance: s.performance ?? undefined,
          accessibility: s.accessibility ?? undefined,
          bestPractices: s.bestPractices ?? undefined,
          seo: s.seo ?? undefined,
          lcpMs: s.lcpMs ?? undefined,
          clsX1000: s.clsX1000 ?? undefined,
          inpMs: s.inpMs ?? undefined,
          ttfbMs: s.ttfbMs ?? undefined,
          fcpMs: s.fcpMs ?? undefined,
          raw: undefined, // skip storing the 1–2 MB Lighthouse payload
        },
        select: {
          id: true, url: true, strategy: true, performance: true,
          accessibility: true, bestPractices: true, seo: true,
          lcpMs: true, clsX1000: true, inpMs: true, ttfbMs: true, fcpMs: true,
          createdAt: true,
        },
      });
      results.push(row);
    } catch (err) {
      results.push({ strategy, error: (err as Error).message });
    }
  }

  return NextResponse.json({ ok: true, results });
}
