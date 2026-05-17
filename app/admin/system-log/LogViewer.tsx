"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stream = "out" | "error";
type Level = "error" | "warn" | "info" | "all";

const LEVEL_STYLE: Record<Exclude<Level, "all">, string> = {
  error: "bg-rose-50 text-rose-700 border-rose-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-ink-50 text-ink-700 border-ink-200",
};

type Row = { line: string; level: Exclude<Level, "all"> };

export function LogViewer() {
  const [stream, setStream] = useState<Stream>("out");
  const [level, setLevel] = useState<Level>("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ stream });
      if (level !== "all") params.set("level", level);
      if (q) params.set("q", q);
      const r = await fetch(`/api/admin/system-log?${params.toString()}`, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "load_failed");
      setRows(data.rows);
      setPath(data.path);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [stream, level, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      tick.current = setInterval(load, 5000);
    } else if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [autoRefresh, load]);

  return (
    <div className="space-y-3">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Stream</span>
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value as Stream)}
            className="mt-1 h-10 w-36 rounded-lg border border-ink-200 px-2 text-[13px]"
          >
            <option value="out">stdout</option>
            <option value="error">stderr</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="mt-1 h-10 w-32 rounded-lg border border-ink-200 px-2 text-[13px]"
          >
            <option value="all">all</option>
            <option value="error">error</option>
            <option value="warn">warn</option>
            <option value="info">info</option>
          </select>
        </label>
        <label className="block flex-1 min-w-[16rem]">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="prisma, fetch, OTP…"
            className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className="h-10 rounded-lg bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
        >
          {busy ? "Loading…" : "Refresh"}
        </button>
        <label className="flex items-center gap-2 text-[12.5px] text-ink-700">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (5s)
        </label>
      </div>

      <div className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-2.5 text-[11.5px] text-ink-500">
          <div className="font-mono">{path || "—"}</div>
          <div>{rows.length} lines</div>
        </header>
        {err && (
          <div className="px-5 py-3 text-[12.5px] text-rose-700 bg-rose-50">Error: {err}</div>
        )}
        <ul className="max-h-[70vh] overflow-y-auto divide-y divide-ink-200/60 font-mono text-[12px]">
          {rows.length === 0 && (
            <li className="px-5 py-8 text-center text-ink-500">No matching lines.</li>
          )}
          {rows.map((r, i) => (
            <li key={i} className="flex gap-2 px-4 py-1.5 items-start">
              <span
                className={`shrink-0 mt-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${LEVEL_STYLE[r.level]}`}
              >
                {r.level}
              </span>
              <pre className="flex-1 whitespace-pre-wrap break-all text-ink-800">{r.line}</pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
