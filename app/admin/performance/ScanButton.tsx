"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/performance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "both" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "scan_failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-lg bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
      >
        {busy ? "Scanning… (40–60 s)" : "Run audit"}
      </button>
      {err && <span className="text-[11px] text-rose-700">{err}</span>}
    </div>
  );
}
