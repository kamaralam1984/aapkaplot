import { Eye, Inbox, IndianRupee, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { MOCK_SELLER_LISTINGS } from "@/lib/mock-dashboard";
import { formatInr } from "@/lib/format";

export default function SellerAnalyticsPage() {
  const totalViews = MOCK_SELLER_LISTINGS.reduce((s, l) => s + l.views, 0);
  const totalLeads = MOCK_SELLER_LISTINGS.reduce((s, l) => s + l.leadsCount, 0);
  const ctr = ((totalLeads / Math.max(1, totalViews)) * 100).toFixed(2);

  // Mock 14-day spark series.
  const series = Array.from({ length: 14 }, (_, i) =>
    Math.round(120 + Math.sin(i / 2) * 50 + Math.random() * 60)
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Performance"
        title="Listing analytics"
        subtitle="Track who's seeing your properties and how they convert into leads."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views (30d)" value={totalViews.toLocaleString("en-IN")} delta={{ value: "+18%", direction: "up" }} icon={Eye} tone="sky" />
        <StatCard label="Leads (30d)" value={totalLeads} delta={{ value: "+6", direction: "up" }} icon={Inbox} tone="emerald" />
        <StatCard label="Lead rate" value={`${ctr}%`} helper="leads ÷ views" icon={TrendingUp} tone="amber" />
        <StatCard label="Est. pipeline" value={formatInr(2_85_000)} delta={{ value: "Active leads", direction: "up" }} icon={IndianRupee} tone="violet" />
      </div>

      <section className="surface-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-ink-900">Visitors trend</h3>
            <p className="text-[12.5px] text-ink-500">Last 14 days</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700">
            <TrendingUp className="h-3 w-3" /> +24%
          </span>
        </div>
        <Spark series={series} />
      </section>

      <section className="surface-card p-5">
        <h3 className="text-[14px] font-bold text-ink-900">Top performing listings</h3>
        <ul className="mt-3 divide-y divide-ink-200/70">
          {[...MOCK_SELLER_LISTINGS]
            .sort((a, b) => b.views - a.views)
            .map((p) => {
              const cr = ((p.leadsCount / Math.max(1, p.views)) * 100).toFixed(2);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <p className="flex-1 truncate text-[13px] font-semibold text-ink-900">{p.title}</p>
                  <span className="hidden text-[12px] text-ink-500 sm:inline">{p.views.toLocaleString("en-IN")} views</span>
                  <span className="hidden text-[12px] text-ink-500 sm:inline">{p.leadsCount} leads</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700">{cr}% CR</span>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}

function Spark({ series }: { series: number[] }) {
  const w = 100;
  const h = 36;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x.toFixed(2), y.toFixed(2)] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 12}`} className="mt-4 h-32 w-full">
      <defs>
        <linearGradient id="seller-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#seller-spark)" />
      <path d={line} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
