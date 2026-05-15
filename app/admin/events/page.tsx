"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Search, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EventRow {
  name: string;
  at: number;
  props: Record<string, unknown>;
}

const TONE_BY_PREFIX: { test: RegExp; tone: string }[] = [
  { test: /^property_saved$/,    tone: "bg-rose-50 text-rose-700" },
  { test: /^property_unsaved$/,  tone: "bg-ink-100 text-ink-700" },
  { test: /^phone_revealed$/,    tone: "bg-sky-50 text-sky-700" },
  { test: /^visit_requested$/,   tone: "bg-emerald-50 text-emerald-700" },
  { test: /^auth_/,              tone: "bg-violet-50 text-violet-700" },
  { test: /^search_/,            tone: "bg-amber-50 text-amber-700" },
];

function toneFor(name: string) {
  return TONE_BY_PREFIX.find((t) => t.test.test(name))?.tone ?? "bg-ink-100 text-ink-700";
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/events/track", { cache: "no-store" });
      const data = await res.json();
      setEvents(data.events ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll every 4s when auto-refresh is on.
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [auto, load]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return events;
    return events.filter((e) => {
      if (e.name.toLowerCase().includes(needle)) return true;
      return JSON.stringify(e.props).toLowerCase().includes(needle);
    });
  }, [events, q]);

  // KPI tiles
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) map.set(e.name, (map.get(e.name) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [events]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Telemetry"
        title="Live event feed"
        subtitle="Every action fired through track() lands here. Newest first."
        actions={
          <div className="flex items-center gap-2">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-700 shadow-soft">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="h-3.5 w-3.5 accent-emerald-500"
              />
              Auto-refresh
            </label>
            <Button
              variant="outline"
              size="md"
              onClick={load}
              disabled={busy}
              iconLeft={<RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top events KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.length === 0 ? (
          <div className="surface-card p-5 text-[13px] text-ink-500 lg:col-span-4">
            No events yet — interact with the app and come back.
          </div>
        ) : (
          counts.map(([name, count]) => (
            <div key={name} className="surface-card p-4">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", toneFor(name))}>
                <Activity className="h-3 w-3" />
                {name}
              </span>
              <p className="mt-2 text-2xl font-bold text-ink-900">{count.toLocaleString("en-IN")}</p>
              <p className="text-[11.5px] text-ink-500">last {events.length} events</p>
            </div>
          ))
        )}
      </div>

      {/* Search */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-ink-200/70 px-5 py-3">
          <div className="relative h-10 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by event name or property id…"
              className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </div>

        <ul className="divide-y divide-ink-200/70 max-h-[60vh] overflow-y-auto">
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.li
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid place-items-center gap-1 px-5 py-12 text-center text-ink-500"
              >
                <FileText className="h-7 w-7 text-ink-300" />
                <p className="text-[13px]">No matching events.</p>
              </motion.li>
            ) : (
              filtered.map((e, i) => (
                <motion.li
                  key={`${e.at}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  <span className={cn("mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", toneFor(e.name))}>
                    {e.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    {Object.keys(e.props).length > 0 ? (
                      <code className="block truncate text-[11.5px] font-mono text-ink-700">
                        {Object.entries(e.props)
                          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                          .join(" · ")}
                      </code>
                    ) : (
                      <span className="text-[11.5px] text-ink-400">— no props —</span>
                    )}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[11.5px] text-ink-500">
                    {formatRelativeTime(new Date(e.at).toISOString())}
                  </span>
                </motion.li>
              ))
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
