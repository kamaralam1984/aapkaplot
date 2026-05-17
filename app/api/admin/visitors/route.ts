import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const minuteMs = 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

/**
 * GET /api/admin/visitors
 *
 * Polled by /admin/visitors every 10 s for live updates. Same payload
 * shape the SSR page sends down on initial paint.
 */
export async function GET() {
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  }
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const now = Date.now();
  const since1d   = new Date(now - 1 * dayMs);
  const since7d   = new Date(now - 7 * dayMs);
  const since30d  = new Date(now - 30 * dayMs);
  const since365d = new Date(now - 365 * dayMs);
  const since5m   = new Date(now - 5 * minuteMs);

  const [active5m, today, week, month, year, total, latest, topCountries] = await Promise.all([
    prisma.visit.count({ where: { lastSeenAt: { gte: since5m } } }),
    prisma.visit.count({ where: { landedAt: { gte: since1d } } }),
    prisma.visit.count({ where: { landedAt: { gte: since7d } } }),
    prisma.visit.count({ where: { landedAt: { gte: since30d } } }),
    prisma.visit.count({ where: { landedAt: { gte: since365d } } }),
    prisma.visit.count(),
    prisma.visit.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 50,
      select: {
        id: true, sessionId: true, userName: true, userEmail: true,
        country: true, region: true, city: true, district: true,
        pageviews: true, lastPath: true, propertiesViewed: true,
        landedAt: true, lastSeenAt: true,
      },
    }),
    prisma.visit
      .groupBy({
        by: ["country"],
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      })
      .catch(() => [] as { country: string | null; _count: { _all: number } }[]),
  ]);

  return NextResponse.json({
    stats: { active5m, today, week, month, year, total },
    latest: latest.map((v) => ({
      id: v.id,
      name: v.userName ?? null,
      email: v.userEmail ?? null,
      country: v.country ?? null,
      region: v.region ?? null,
      city: v.city ?? null,
      district: v.district ?? null,
      pageviews: v.pageviews,
      lastPath: v.lastPath ?? null,
      propertiesViewed: v.propertiesViewed,
      landedAt: v.landedAt.toISOString(),
      lastSeenAt: v.lastSeenAt.toISOString(),
    })),
    topCountries: topCountries.map((c) => ({ country: c.country, count: c._count._all })),
  });
}
