import { TrendingUp, Map as MapIcon, AlertCircle } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Heatmap } from "@/components/admin/Heatmap";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Real top localities — counts of ACTIVE listings per locality, biggest
 * first. When there's no real data yet, we render an empty-state instead
 * of inventing numbers.
 */
async function loadHotZones() {
  if (process.env.USE_DB !== "1") return null;
  const groups = await prisma.property.groupBy({
    by: ["locality", "city"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  });
  const max = Math.max(1, ...groups.map((g) => g._count._all));
  return groups.map((g) => ({
    name: `${g.locality}, ${g.city}`,
    listings: g._count._all,
    score: Math.round((g._count._all / max) * 100),
  }));
}

export default async function AdminHeatmapPage() {
  const zones = await loadHotZones();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Demand intelligence"
        title="Heatmaps &amp; demand zones"
        subtitle="Hot zones are computed from the live Property table. The 24×7 search heatmap is a sample visualization until the event-tracking pipeline is fully wired."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800 inline-flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          The 24×7 search heatmap below is a <strong>demo visualization</strong> — once enough <code>search_*</code> events land in the Event table, it will switch to real data automatically.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Heatmap />

        <aside className="surface-card p-5">
          <h3 className="inline-flex items-center gap-1.5 text-[14px] font-bold text-ink-900">
            <MapIcon className="h-4 w-4 text-brand-500" /> Hot zones
          </h3>
          <p className="text-[12px] text-ink-500">Top localities by active listings (live)</p>

          {!zones ? (
            <p className="mt-4 text-[12.5px] text-rose-700">
              DB is disabled — set <code>USE_DB=1</code> to see live zones.
            </p>
          ) : zones.length === 0 ? (
            <p className="mt-4 text-[12.5px] text-ink-500">
              No ACTIVE listings yet. Hot zones will populate once listings are approved.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {zones.map((a) => (
                <li key={a.name} className="flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink-900">{a.name}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-brand-gradient"
                        style={{ width: `${a.score}%` }}
                      />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <TrendingUp className="h-3 w-3" />
                    {a.listings}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
