import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { prisma } from "@/server/db";
import { VisitorsLive } from "./VisitorsLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const minuteMs = 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

export default async function VisitorsPage() {
  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Live" title="Visitors" subtitle="DB is off." />
      </div>
    );
  }

  const now = Date.now();
  const since1d  = new Date(now - 1 * dayMs);
  const since7d  = new Date(now - 7 * dayMs);
  const since30d = new Date(now - 30 * dayMs);
  const since365d = new Date(now - 365 * dayMs);
  const since5m  = new Date(now - 5 * minuteMs);

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
    prisma.visit.groupBy({
      by: ["country"],
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Live"
        title="Visitors"
        subtitle="Every browser session is recorded once per page load. Geo + name + viewed listings auto-update from Cloudflare headers and the session cookie."
      />

      <VisitorsLive
        initial={{
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
        }}
      />
    </div>
  );
}
