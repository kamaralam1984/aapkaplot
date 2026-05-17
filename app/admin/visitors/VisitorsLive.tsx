"use client";

import { useEffect, useState } from "react";
import { Users, Eye, Clock, Globe, MapPin, Radio } from "lucide-react";

interface VisitRow {
  id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  district: string | null;
  pageviews: number;
  lastPath: string | null;
  propertiesViewed: string[];
  landedAt: string;
  lastSeenAt: string;
}

interface Payload {
  stats: { active5m: number; today: number; week: number; month: number; year: number; total: number };
  latest: VisitRow[];
  topCountries: { country: string | null; count: number }[];
}

export function VisitorsLive({ initial }: { initial: Payload }) {
  const [data, setData] = useState<Payload>(initial);

  // Poll the same JSON the page rendered with. 10 s feels live without
  // pummeling the DB.
  useEffect(() => {
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/admin/visitors", { cache: "no-store" });
        if (!r.ok) return;
        const next = (await r.json()) as Payload;
        if (!cancelled) setData(next);
      } catch {
        /* swallow — next tick retries */
      }
    }, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const fmt = (s: string) => new Date(s).toLocaleString("en-IN", { hour12: false });
  const durationMin = (a: string, b: string) =>
    Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000));

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi tone="emerald" icon={<Radio className="h-4 w-4" />}  label="Active now (5 min)" value={data.stats.active5m} />
        <Kpi tone="violet"  icon={<Users className="h-4 w-4" />}  label="Today"            value={data.stats.today} />
        <Kpi tone="sky"     icon={<Users className="h-4 w-4" />}  label="This week"        value={data.stats.week} />
        <Kpi tone="amber"   icon={<Users className="h-4 w-4" />}  label="This month"       value={data.stats.month} />
        <Kpi tone="rose"    icon={<Users className="h-4 w-4" />}  label="This year"        value={data.stats.year} />
        <Kpi tone="ink"     icon={<Eye   className="h-4 w-4" />}  label="All-time visits"  value={data.stats.total} />
      </div>

      {/* Top countries */}
      {data.topCountries.length > 0 && (
        <section className="surface-card p-5">
          <header className="mb-3 inline-flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-500" />
            <h3 className="text-[14px] font-bold text-ink-900">Top countries</h3>
          </header>
          <ul className="flex flex-wrap gap-2">
            {data.topCountries.map((c, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-[12px] font-semibold text-ink-800"
              >
                <span className="text-[14px]">{flag(c.country)}</span>
                {c.country ?? "Unknown"}
                <span className="ml-1 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums">
                  {c.count.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Latest visits table */}
      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3">
          <h3 className="inline-flex items-center gap-2 text-[14px] font-bold text-ink-900">
            <Clock className="h-4 w-4 text-brand-500" />
            Latest visits
          </h3>
          <span className="inline-flex items-center gap-1 text-[11.5px] text-emerald-700">
            <span className="grid h-2 w-2 place-items-center">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </span>
            Live · refresh 10 s
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-[12.5px]">
            <thead className="bg-ink-50/50 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2">Visitor</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2">Listings viewed</th>
                <th className="px-3 py-2 text-right">Pageviews</th>
                <th className="px-3 py-2 text-right">Duration</th>
                <th className="px-3 py-2">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {data.latest.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-ink-500">
                    No visits yet. Once visitors land on the site, they'll appear here within a few seconds.
                  </td>
                </tr>
              ) : (
                data.latest.map((v) => {
                  const recent = Date.now() - new Date(v.lastSeenAt).getTime() < 5 * 60_000;
                  return (
                    <tr key={v.id} className="hover:bg-ink-50/50">
                      <td className="px-3 py-2 align-top">
                        <div className="font-bold text-ink-900">
                          {v.name ?? <span className="text-ink-500">Anonymous</span>}
                        </div>
                        <div className="truncate text-[11px] text-ink-500">{v.email ?? "—"}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-900">
                          <span className="text-[14px]">{flag(v.country)}</span>
                          {v.city ?? v.region ?? v.country ?? "—"}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {[v.district, v.region, v.country].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <code className="block max-w-[180px] truncate text-[11px] text-ink-700">
                          {v.lastPath ?? "—"}
                        </code>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold text-ink-700">
                          <MapPin className="h-3 w-3" />
                          {v.propertiesViewed.length}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right align-top tabular-nums text-ink-800">{v.pageviews}</td>
                      <td className="px-3 py-2 text-right align-top tabular-nums text-ink-800">
                        {durationMin(v.landedAt, v.lastSeenAt)} m
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-ink-600">
                        {recent && (
                          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" aria-label="active" />
                        )}
                        {fmt(v.lastSeenAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  tone, icon, label, value,
}: {
  tone: "emerald" | "violet" | "sky" | "amber" | "rose" | "ink";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const map: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    violet:  "bg-violet-50 text-violet-700",
    sky:     "bg-sky-50 text-sky-700",
    amber:   "bg-amber-50 text-amber-700",
    rose:    "bg-rose-50 text-rose-700",
    ink:     "bg-ink-100 text-ink-700",
  };
  return (
    <div className="surface-card p-4">
      <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold ${map[tone]}`}>
        {icon}
        {label}
      </span>
      <p className="mt-2 text-2xl font-bold tabular-nums text-ink-900">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

/** Map an ISO-3166-1 alpha-2 country code (what Cloudflare returns) to its
 *  flag emoji. Cheap, no library. */
function flag(cc: string | null | undefined): string {
  if (!cc || cc.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...cc.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
