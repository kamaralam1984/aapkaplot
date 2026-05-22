"use client";

import { useEffect, useState, useCallback } from "react";

type RecentVisit = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  city: string | null;
  country: string | null;
  lastPath: string | null;
  lastSeenAt: string;
  pageviews: number;
  referrer: string | null;
};

type GrowthRow = { month: string; count: number };

type LiveData = {
  liveNow: number;
  liveLastMin: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  topCountries: { country: string; count: number }[];
  topCities: { city: string; count: number }[];
  topPages: { path: string; count: number }[];
  recentActivity: RecentVisit[];
  userGrowth: GrowthRow[];
  totalUsers: number;
  totalLeads: number;
  totalProperties: number;
  revenueInr: number;
};

const COUNTRY_FLAGS: Record<string, string> = {
  India: "🇮🇳", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  Canada: "🇨🇦", Australia: "🇦🇺", UAE: "🇦🇪", Germany: "🇩🇪",
  Singapore: "🇸🇬", France: "🇫🇷", Pakistan: "🇵🇰", Bangladesh: "🇧🇩",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatInr(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function SkeletonBar({ w }: { w: string }) {
  return <div className={`h-4 rounded bg-slate-200 animate-pulse ${w}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="surface-card p-4 space-y-2">
            <SkeletonBar w="w-2/3" />
            <SkeletonBar w="w-1/2" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5 h-48 animate-pulse bg-slate-100" />
        <div className="surface-card p-5 h-48 animate-pulse bg-slate-100" />
      </div>
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 truncate">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-500">{sub}</p>}
    </div>
  );
}

function AreaChart({ rows }: { rows: GrowthRow[] }) {
  const W = 600;
  const H = 120;
  const PAD = { t: 10, r: 10, b: 30, l: 36 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  if (!rows.length) {
    return (
      <div className="flex h-32 items-center justify-center text-[12px] text-ink-500">
        No signup data yet
      </div>
    );
  }

  const max = Math.max(1, ...rows.map(r => r.count));
  const pts = rows.map((r, i) => {
    const x = PAD.l + (i / Math.max(1, rows.length - 1)) * iW;
    const y = PAD.t + iH - (r.count / max) * iH;
    return { x, y, r };
  });

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} L${PAD.l},${(PAD.t + iH).toFixed(1)} Z`;

  const labels = pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % 3 === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      <defs>
        <linearGradient id="ld-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = PAD.t + iH - frac * iH;
        return (
          <g key={frac}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(frac * max)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#ld-area)" />
      <path d={line} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <circle key={p.r.month} cx={p.x} cy={p.y} r="2.5" fill="#6366f1" />
      ))}
      {labels.map((p) => {
        const d = new Date(p.r.month);
        const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
        return (
          <text key={p.r.month} x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#6b7280">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function HBarList({ items, max, colorClass }: { items: { label: string; count: number }[]; max: number; colorClass: string }) {
  return (
    <ul className="space-y-2">
      {items.map(({ label, count }) => (
        <li key={label} className="flex items-center gap-2 text-[12.5px]">
          <span className="w-32 shrink-0 truncate text-ink-700">{label}</span>
          <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${colorClass}`}
              style={{ width: `${Math.round((count / Math.max(1, max)) * 100)}%` }}
            />
          </div>
          <span className="w-8 text-right font-semibold text-ink-900">{count}</span>
        </li>
      ))}
    </ul>
  );
}

function PageHeatmap({ pages }: { pages: { path: string; count: number }[] }) {
  const maxCount = Math.max(1, pages[0]?.count ?? 1);
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

  return (
    <div className="space-y-2">
      {pages.map(({ path, count }, i) => {
        const pct = Math.max(4, Math.round((count / maxCount) * 100));
        return (
          <div key={path} className="flex items-center gap-2 text-[12px]">
            <span className="w-5 text-right text-ink-500 shrink-0">{i + 1}</span>
            <div className="flex-1 overflow-hidden rounded" style={{ backgroundColor: "#f1f5f9" }}>
              <div
                className="h-6 flex items-center px-2 text-white text-[11px] font-medium truncate"
                style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length], minWidth: 32 }}
                title={path}
              >
                {pct > 15 ? path : ""}
              </div>
            </div>
            <span className="w-8 text-right font-semibold text-ink-900 shrink-0">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function LiveDashboard() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics/live");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, [fetch_]);

  if (loading) return <LoadingSkeleton />;
  if (!data) return null;

  const countryMax = data.topCountries[0]?.count ?? 1;
  const cityMax = data.topCities[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-semibold text-emerald-700">Live</span>
          {lastRefresh && (
            <span className="text-[11px] text-ink-500">· refreshed {timeAgo(lastRefresh.toISOString())}</span>
          )}
        </div>
        <button
          onClick={fetch_}
          className="text-[11.5px] text-brand-600 hover:underline font-medium"
        >
          Refresh now
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatPill label="Live Now" value={data.liveNow} sub="last 5 min" />
        <StatPill label="Today" value={data.todayVisits.toLocaleString("en-IN")} sub="sessions" />
        <StatPill label="This Week" value={data.weekVisits.toLocaleString("en-IN")} sub="sessions" />
        <StatPill label="This Month" value={data.monthVisits.toLocaleString("en-IN")} sub="sessions" />
        <StatPill label="Total Users" value={data.totalUsers.toLocaleString("en-IN")} />
        <StatPill label="Active Listings" value={data.totalProperties.toLocaleString("en-IN")} />
        <StatPill label="Leads (30d)" value={data.totalLeads.toLocaleString("en-IN")} />
        <StatPill label="Revenue (30d)" value={formatInr(data.revenueInr)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h3 className="text-[13.5px] font-bold text-ink-900 mb-4">Visitors by Country — Last 30 Days</h3>
          {data.topCountries.length === 0 ? (
            <p className="text-[12px] text-ink-500">No data</p>
          ) : (
            <ul className="space-y-2">
              {data.topCountries.map(({ country, count }) => (
                <li key={country} className="flex items-center gap-2 text-[12.5px]">
                  <span className="text-base">{COUNTRY_FLAGS[country] ?? "🌐"}</span>
                  <span className="w-28 shrink-0 truncate text-ink-700">{country}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-brand-600"
                      style={{ width: `${Math.round((count / Math.max(1, countryMax)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold text-ink-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <h3 className="text-[13.5px] font-bold text-ink-900 mb-4">Live Activity — Last 24 Hours</h3>
          <div className="overflow-y-auto max-h-56 space-y-2 pr-1">
            {data.recentActivity.length === 0 ? (
              <p className="text-[12px] text-ink-500">No recent activity</p>
            ) : (
              data.recentActivity.map((v) => (
                <div key={v.id} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-ink-900 truncate">
                      {v.userName ?? v.userEmail ?? "Anonymous"}
                    </p>
                    <p className="text-[11px] text-ink-500 truncate">
                      {[v.city, v.country].filter(Boolean).join(", ")}
                      {v.lastPath ? ` · ${v.lastPath}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-ink-500">{timeAgo(v.lastSeenAt)}</span>
                    <p className="text-[11px] text-ink-400">{v.pageviews}pv</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h3 className="text-[13.5px] font-bold text-ink-900 mb-1">User Growth — Last 12 Months</h3>
        <p className="text-[12px] text-ink-500 mb-4">New sign-ups per month</p>
        <AreaChart rows={data.userGrowth} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h3 className="text-[13.5px] font-bold text-ink-900 mb-4">Top Pages — Last 7 Days</h3>
          {data.topPages.length === 0 ? (
            <p className="text-[12px] text-ink-500">No data</p>
          ) : (
            <ul className="space-y-2">
              {data.topPages.map(({ path, count }, i) => (
                <li key={path} className="flex items-center gap-2 text-[12.5px]">
                  <span className="w-5 shrink-0 text-right text-[11px] font-bold text-ink-400">{i + 1}</span>
                  <span className="flex-1 truncate text-ink-700 font-mono text-[11.5px]">{path}</span>
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <h3 className="text-[13.5px] font-bold text-ink-900 mb-4">Live Users by City — Last 7 Days</h3>
          {data.topCities.length === 0 ? (
            <p className="text-[12px] text-ink-500">No data</p>
          ) : (
            <HBarList
              items={data.topCities.map(c => ({ label: c.city, count: c.count }))}
              max={cityMax}
              colorClass="bg-sky-500"
            />
          )}
        </section>
      </div>

      <section className="surface-card p-5">
        <h3 className="text-[13.5px] font-bold text-ink-900 mb-1">Page Heatmap — Last 7 Days</h3>
        <p className="text-[12px] text-ink-500 mb-4">Bar width proportional to visit count</p>
        {data.topPages.length === 0 ? (
          <p className="text-[12px] text-ink-500">No data</p>
        ) : (
          <PageHeatmap pages={data.topPages} />
        )}
      </section>

      <section className="surface-card p-5">
        <h3 className="text-[13.5px] font-bold text-ink-900 mb-4">Activity Tracking — Last 24 Hours</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">User</th>
                <th className="py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">Location</th>
                <th className="py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">Page</th>
                <th className="py-2 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-500">Pageviews</th>
                <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-500">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentActivity.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 pr-4">
                    <p className="font-medium text-ink-900 truncate max-w-[140px]">
                      {v.userName ?? v.userEmail ?? "Anonymous"}
                    </p>
                    {v.referrer && (
                      <p className="text-[10.5px] text-ink-400 truncate max-w-[140px]">{v.referrer}</p>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-ink-600">
                    {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-mono text-[11px] text-ink-700 truncate block max-w-[180px]">
                      {v.lastPath ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right font-semibold text-ink-900">{v.pageviews}</td>
                  <td className="py-2 text-right text-ink-500">{timeAgo(v.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
