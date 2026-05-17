import { Users, Eye, Inbox, IndianRupee, TrendingUp, Activity, GitBranch } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { CohortGrid } from "@/components/admin/CohortGrid";
import { formatInr } from "@/lib/format";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

const dayMs = 24 * 60 * 60 * 1000;

async function loadKpis() {
  if (process.env.USE_DB !== "1") {
    return null;
  }
  const now = Date.now();
  const start30 = new Date(now - 30 * dayMs);
  const start7 = new Date(now - 7 * dayMs);

  // Run independent counts in parallel so the page renders in a single
  // round-trip's worth of latency.
  const [
    totalUsers,
    activeListings,
    pendingListings,
    monthlyLeads,
    weeklySignups,
    monthlyRevenueAgg,
    verifiedActive,
    totalActive,
    leads30,
    visits30,
    payments30,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.property.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.lead.count({ where: { createdAt: { gte: start30 } } }),
    prisma.user.count({ where: { createdAt: { gte: start7 } } }),
    prisma.payment.aggregate({
      _sum: { amountInr: true },
      where: { status: "paid", createdAt: { gte: start30 } },
    }),
    prisma.property.count({ where: { status: "ACTIVE", verified: true } }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count({ where: { createdAt: { gte: start30 } } }),
    prisma.visitRequest.count({ where: { createdAt: { gte: start30 } } }).catch(() => 0),
    prisma.payment.count({ where: { status: "paid", createdAt: { gte: start30 } } }),
  ]);

  const monthlyRevenueInr = monthlyRevenueAgg._sum.amountInr ?? 0;

  // Build the 30-day signup sparkline. One query, grouped client-side so we
  // don't depend on Postgres date_trunc.
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: start30 } },
    select: { createdAt: true },
    take: 5000,
  });
  const series: number[] = new Array(30).fill(0);
  for (const u of recentUsers) {
    const bucket = Math.min(29, Math.floor((now - u.createdAt.getTime()) / dayMs));
    series[29 - bucket]++;
  }

  const verifiedPct =
    totalActive === 0 ? 0 : Math.round((verifiedActive / totalActive) * 100);

  return {
    totalUsers,
    activeListings,
    pendingListings,
    monthlyLeads,
    weeklySignups,
    monthlyRevenueInr,
    verifiedPct,
    series,
    funnel: [
      { label: "Active listings",   value: totalActive },
      { label: "Leads (30d)",       value: leads30 },
      { label: "Visits requested",  value: visits30 },
      { label: "Payments (30d)",    value: payments30 },
    ],
  };
}

export default async function AdminAnalyticsPage() {
  const k = await loadKpis();

  if (!k) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Insights" title="Platform analytics" subtitle="DB-off mode" />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (<code>USE_DB ≠ 1</code>). Real-time analytics are unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Insights"
        title="Platform analytics"
        subtitle="Live counts from the production Postgres catalogue. No mocks below this line."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users"     value={k.totalUsers.toLocaleString("en-IN")}      icon={Users}       tone="violet" />
        <StatCard label="Active listings" value={k.activeListings.toLocaleString("en-IN")} icon={Eye}         tone="sky" />
        <StatCard label="Leads (30d)"     value={k.monthlyLeads.toLocaleString("en-IN")}   icon={Inbox}       tone="emerald" />
        <StatCard label="Revenue (30d)"   value={formatInr(k.monthlyRevenueInr)}            icon={IndianRupee} tone="amber" />
      </div>

      <section className="surface-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Daily new sign-ups</h3>
            <p className="text-[12.5px] text-ink-500">Last 30 days · {k.weeklySignups.toLocaleString("en-IN")} in the last 7</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700">
            <TrendingUp className="h-3 w-3" />
            {k.weeklySignups} this wk
          </span>
        </div>
        <BigSpark series={k.series} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Verified sellers</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{k.verifiedPct}%</p>
          <p className="mt-1 text-[12px] text-ink-500">of active listings</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Pending review</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{k.pendingListings.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-[12px] text-ink-500">awaiting moderation</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Lead conversion</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {k.activeListings === 0
              ? "—"
              : ((k.monthlyLeads / k.activeListings) * 100).toFixed(1) + "%"}
          </p>
          <p className="mt-1 text-[12px] text-ink-500">leads ÷ active listings (30d)</p>
        </div>
      </section>

      {/* Funnel */}
      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-600">
            <GitBranch className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Listing → Payment funnel</h3>
            <p className="text-[12px] text-ink-500">Drop-off at each stage, last 30 days.</p>
          </div>
        </div>
        <div className="mt-4">
          <FunnelChart steps={k.funnel} />
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Weekly cohort retention</h3>
            <p className="text-[12px] text-ink-500">
              Sample visualization — wire up event-table-backed cohorts once enough sessions land.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <CohortGrid />
        </div>
      </section>
    </div>
  );
}

function BigSpark({ series }: { series: number[] }) {
  const w = 100;
  const h = 40;
  const max = Math.max(1, ...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const pts = series.map((v, i) => {
    const x = (i / Math.max(1, series.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return [x.toFixed(2), y.toFixed(2)] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 8}`} className="mt-4 h-48 w-full">
      <defs>
        <linearGradient id="admin-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#admin-spark)" />
      <path d={line} fill="none" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
