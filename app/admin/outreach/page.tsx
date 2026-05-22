import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { prisma } from "@/server/db";
import { OutreachClient } from "./OutreachClient";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="AI Acquisition" title="AI Outreach" subtitle="DB-off mode — enable USE_DB=1 for full functionality" />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled. Set USE_DB=1 in .env.local and rebuild to enable real outreach.
        </div>
        <OutreachClient prospects={[]} stats={{ total: 0, pending: 0, emailed: 0, replied: 0, converted: 0, hot: 0, warm: 0, cold: 0, avgScore: 0 }} />
      </div>
    );
  }

  const [prospects, total, pending, emailed, replied, converted, hot, warm, cold, avgScoreResult] = await Promise.all([
    prisma.outreachProspect.findMany({
      orderBy: { interestScore: "desc" },
      take: 100,
    }),
    prisma.outreachProspect.count(),
    prisma.outreachProspect.count({ where: { status: "pending" } }),
    prisma.outreachProspect.count({ where: { status: "emailed" } }),
    prisma.outreachProspect.count({ where: { status: "replied" } }),
    prisma.outreachProspect.count({ where: { status: "converted" } }),
    prisma.outreachProspect.count({ where: { interestLabel: "hot" } }),
    prisma.outreachProspect.count({ where: { interestLabel: "warm" } }),
    prisma.outreachProspect.count({ where: { interestLabel: "cold" } }),
    prisma.outreachProspect.aggregate({ _avg: { interestScore: true } }),
  ]);

  const stats = {
    total,
    pending,
    emailed,
    replied,
    converted,
    hot,
    warm,
    cold,
    avgScore: Math.round(avgScoreResult._avg.interestScore ?? 0),
  };

  // Serialize dates for client
  const serialized = prospects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    emailSentAt: p.emailSentAt?.toISOString() ?? null,
    emailOpenedAt: p.emailOpenedAt?.toISOString() ?? null,
    repliedAt: p.repliedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="AI Acquisition"
        title="AI Outreach"
        subtitle="Find, score and email real estate prospects automatically."
      />
      <OutreachClient prospects={serialized} stats={stats} />
    </div>
  );
}
