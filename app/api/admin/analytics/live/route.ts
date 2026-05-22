import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;
  if (process.env.USE_DB !== "1") return NextResponse.json({ error: "db_off" }, { status: 503 });

  const now = Date.now();
  const m5  = new Date(now - 5 * 60 * 1000);
  const m1  = new Date(now - 1 * 60 * 1000);
  const d1  = new Date(now - 86400000);
  const d7  = new Date(now - 7 * 86400000);
  const d30 = new Date(now - 30 * 86400000);

  const [
    liveNow,
    liveLastMin,
    todayVisits,
    weekVisits,
    monthVisits,
    topCountries,
    topCities,
    topPages,
    recentActivity,
    userGrowth,
    totalUsers,
    totalLeads,
    totalProperties,
    totalRevenue,
  ] = await Promise.all([
    prisma.visit.count({ where: { lastSeenAt: { gte: m5 } } }),
    prisma.visit.count({ where: { lastSeenAt: { gte: m1 } } }),
    prisma.visit.count({ where: { landedAt: { gte: d1 } } }),
    prisma.visit.count({ where: { landedAt: { gte: d7 } } }),
    prisma.visit.count({ where: { landedAt: { gte: d30 } } }),
    prisma.visit.groupBy({ by: ["country"], where: { country: { not: null }, landedAt: { gte: d30 } }, _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 8 }),
    prisma.visit.groupBy({ by: ["city"], where: { city: { not: null }, landedAt: { gte: d7 } }, _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 8 }),
    prisma.visit.groupBy({ by: ["lastPath"], where: { lastPath: { not: null }, landedAt: { gte: d7 } }, _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
    prisma.visit.findMany({ where: { lastSeenAt: { gte: d1 } }, orderBy: { lastSeenAt: "desc" }, take: 20, select: { id: true, userName: true, userEmail: true, city: true, country: true, lastPath: true, lastSeenAt: true, pageviews: true, referrer: true } }),
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month ORDER BY month ASC
    `,
    prisma.user.count(),
    prisma.lead.count({ where: { createdAt: { gte: d30 } } }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.microPayment.aggregate({ where: { status: "paid", createdAt: { gte: d30 } }, _sum: { amountPaise: true } }).catch(() => ({ _sum: { amountPaise: null } })),
  ]);

  return NextResponse.json({
    liveNow, liveLastMin, todayVisits, weekVisits, monthVisits,
    topCountries: topCountries.map(r => ({ country: r.country!, count: r._count._all })),
    topCities: topCities.map(r => ({ city: r.city!, count: r._count._all })),
    topPages: topPages.map(r => ({ path: r.lastPath!, count: r._count._all })),
    recentActivity,
    userGrowth,
    totalUsers, totalLeads, totalProperties,
    revenueInr: Math.round((totalRevenue._sum.amountPaise ?? 0) / 100),
  });
}
