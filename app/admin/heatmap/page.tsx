import { TrendingUp, Map as MapIcon } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Heatmap } from "@/components/admin/Heatmap";

const TOP_AREAS = [
  { name: "New Town, Kolkata",      score: 92, delta: "+18%" },
  { name: "Rajarhat, Kolkata",      score: 88, delta: "+14%" },
  { name: "Salt Lake, Kolkata",     score: 79, delta: "+9%" },
  { name: "Howrah Central",         score: 71, delta: "+6%" },
  { name: "Behala, Kolkata",        score: 66, delta: "+4%" },
];

export default function AdminHeatmapPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Demand intelligence"
        title="Heatmaps &amp; demand zones"
        subtitle="Where buyers are searching, and which micro-markets are heating up."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Heatmap />

        <aside className="surface-card p-5">
          <h3 className="inline-flex items-center gap-1.5 text-[14px] font-bold text-ink-900">
            <MapIcon className="h-4 w-4 text-brand-500" /> Hot zones
          </h3>
          <p className="text-[12px] text-ink-500">Top growing markets this month</p>
          <ul className="mt-3 space-y-2">
            {TOP_AREAS.map((a) => (
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
                  {a.delta}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
