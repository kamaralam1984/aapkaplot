"use client";

import { useState, useTransition } from "react";

const STATUS_OPTIONS = ["new", "contacted", "qualified", "lost"] as const;
type LeadStatus = (typeof STATUS_OPTIONS)[number];

const COLORS: Record<LeadStatus, string> = {
  new:       "bg-sky-100 text-sky-800",
  contacted: "bg-violet-100 text-violet-800",
  qualified: "bg-emerald-100 text-emerald-800",
  lost:      "bg-red-100 text-red-700",
};

export function LeadStatusSelect({
  leadId,
  initialStatus,
}: {
  leadId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState<LeadStatus>(
    STATUS_OPTIONS.includes(initialStatus as LeadStatus)
      ? (initialStatus as LeadStatus)
      : "new",
  );
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update(next: LeadStatus) {
    setOpen(false);
    if (next === status) return;
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const res = await fetch(`/api/builder/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) setStatus(prev);
    });
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize cursor-pointer hover:opacity-80 transition-opacity ${COLORS[status] ?? "bg-slate-100 text-slate-700"}`}
      >
        {status}
        <span className="opacity-60">{isPending ? "…" : "▾"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-28 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => update(s)}
                className={`w-full px-3 py-1.5 text-left text-[12px] capitalize font-medium transition-colors hover:bg-slate-50 ${
                  s === status ? "text-brand-600" : "text-ink-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
