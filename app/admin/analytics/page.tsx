import { Users, Eye, Inbox, IndianRupee, TrendingUp, Activity, GitBranch } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { CohortGrid } from "@/components/admin/CohortGrid";
import { MOCK_ADMIN_KPIS } from "@/lib/mock-dashboard";
import { formatInr } from "@/lib/format";

const FUNNEL = [
  { label: "Search ran",       value: 48_712 },
  { label: "Property viewed",  value: 22_184 },
  { label: "Owner contacted",  value: 4_356 },
  { label: "Visit scheduled",  value: 1_802 },
  { label: "Closed / sold",    value: 312 },
];

export default function AdminAnalyticsPage() {
  const series = Array.from({ length: 30 }, (_, i) =>
    Math.round(800 + Math.sin(i / 3) * 220 + Math.random() * 240)
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Insights"
        title="Platform analytics"
        subtitle="Top-line metrics across the entire AapKaPlot network."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="DAU"            value="3,214" delta={{ value: "+5%", direction: "up" }} icon={Users} tone="violet" />
        <StatCard label="Property views" value="48,712" delta={{ value: "+12%", direction: "up" }} icon={Eye} tone="sky" />
        <StatCard label="Leads"          value={MOCK_ADMIN_KPIS.monthlyLeads.toLocaleString("en-IN")} delta={{ value: "+14%", direction: "up" }} icon={Inbox} tone="emerald" />
        <StatCard label="Revenue (30d)"  value={formatInr(MOCK_ADMIN_KPIS.monthlyRevenueInr)} delta={{ value: "+22%", direction: "up" }} icon={IndianRupee} tone="amber" />
      </div>

      <section className="surface-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Daily active users</h3>
            <p className="text-[12.5px] text-ink-500">Last 30 days</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700">
            <TrendingUp className="h-3 w-3" /> +14%
          </span>
        </div>
        <BigSpark series={series} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { label: "Conversion rate",  value: "4.2%",  helper: "leads ÷ views" },
          { label: "Avg. response",    value: "47 min", helper: "owner reply latency" },
          { label: "Verified sellers", value: "78%",   helper: "of active listings" },
        ].map((c) => (
          <div key={c.label} className="surface-card p-5">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink-900">{c.value}</p>
            <p className="mt-1 text-[12px] text-ink-500">{c.helper}</p>
          </div>
        ))}
      </section>

      {/* Funnel */}
      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-600">
            <GitBranch className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Search → Sale funnel</h3>
            <p className="text-[12px] text-ink-500">Drop-off at each stage of the buyer journey, last 30 days.</p>
          </div>
        </div>
        <div className="mt-4">
          <FunnelChart steps={FUNNEL} />
        </div>
      </section>

      {/* Cohort retention */}
      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Weekly cohort retention</h3>
            <p className="text-[12px] text-ink-500">How long users from each weekly signup cohort keep coming back.</p>
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
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w;
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
