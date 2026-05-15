"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Check, X, Sparkles, ExternalLink, Copy, AlertTriangle, IndianRupee, ShieldOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { scanForFraud, type FraudFlag, type FraudReason } from "@/ai/fraud";
import { formatInr } from "@/lib/format";

const REASON_META: Record<FraudReason, { label: string; icon: React.ReactNode; tone: string }> = {
  "duplicate-image":   { label: "Duplicate image",   icon: <Copy className="h-3 w-3" />,         tone: "bg-amber-50 text-amber-700 border-amber-200/70" },
  "duplicate-listing": { label: "Duplicate listing", icon: <Copy className="h-3 w-3" />,         tone: "bg-amber-50 text-amber-700 border-amber-200/70" },
  "price-anomaly":     { label: "Price anomaly",     icon: <IndianRupee className="h-3 w-3" />,  tone: "bg-rose-50 text-rose-700 border-rose-200/70" },
  "suspicious-title":  { label: "Suspicious title",  icon: <AlertTriangle className="h-3 w-3" />, tone: "bg-rose-50 text-rose-700 border-rose-200/70" },
  "low-trust":         { label: "Low trust",         icon: <ShieldOff className="h-3 w-3" />,    tone: "bg-ink-100 text-ink-700 border-ink-200" },
};

type Decision = "open" | "cleared" | "removed";

export default function AdminFraudPage() {
  const flags = useMemo(() => scanForFraud(MOCK_PROPERTIES), []);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const totals = {
    all: flags.length,
    high: flags.filter((f) => f.severity === "high").length,
    medium: flags.filter((f) => f.severity === "medium").length,
    low: flags.filter((f) => f.severity === "low").length,
  };

  const visible = flags
    .filter((f) => (decisions[f.propertyId] ?? "open") === "open")
    .filter((f) => filter === "all" || f.severity === filter);

  const decide = (propertyId: string, d: Decision) => {
    setDecisions((cur) => ({ ...cur, [propertyId]: d }));
    if (d !== "open") {
      fetch("/api/admin/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId, scope: "fraud", status: d }),
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> AI Trust & Safety
          </span>
        }
        title="Fraud detection queue"
        subtitle="Listings auto-flagged by the heuristic engine (image dedupe · price z-score · suspicious keywords)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard tone="violet" label="Scanned" value={MOCK_PROPERTIES.length} helper="active listings" />
        <KpiCard tone="rose"    label="High risk" value={totals.high}    helper="≥ 50 fraud score" />
        <KpiCard tone="amber"   label="Medium"    value={totals.medium}  helper="25 – 49" />
        <KpiCard tone="emerald" label="Low / OK"  value={totals.low + (MOCK_PROPERTIES.length - flags.length)} helper="< 25 score" />
      </div>

      {/* Filter chips */}
      <div role="tablist" className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
        {(["all", "high", "medium", "low"] as const).map((s) => {
          const active = s === filter;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(s)}
              className={cn(
                "relative inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold capitalize transition",
                active ? "text-white" : "text-ink-700 hover:bg-ink-100/60"
              )}
            >
              {active && (
                <motion.span
                  layoutId="fraud-filter"
                  className="absolute inset-0 rounded-lg bg-ink-900 shadow-soft"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative">{s} · {totals[s]}</span>
            </button>
          );
        })}
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {visible.map((flag) => {
            const p = MOCK_PROPERTIES.find((x) => x.id === flag.propertyId);
            if (!p) return null;
            return (
              <motion.li
                key={flag.propertyId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="surface-card overflow-hidden"
              >
                <div className="flex gap-3 p-3">
                  <Link href={`/property/${p.id}`} className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                    <Image src={p.media.cover} alt={p.title} fill sizes="128px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                        flag.severity === "high"   ? "bg-rose-50 text-rose-700"   :
                        flag.severity === "medium" ? "bg-amber-50 text-amber-700" :
                                                     "bg-ink-100 text-ink-700"
                      )}>
                        <ShieldAlert className="h-3 w-3" />
                        {flag.severity} · {flag.score}
                      </span>
                      <Link href={`/property/${p.id}`} className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50">
                        <ExternalLink className="h-3 w-3" /> Open
                      </Link>
                    </div>
                    <Link href={`/property/${p.id}`} className="mt-1 block truncate text-[14px] font-bold text-ink-900 hover:underline">
                      {p.title}
                    </Link>
                    <p className="truncate text-[12px] text-ink-500">
                      {p.location.locality}, {p.location.city} · {formatInr(p.priceInr)} · {p.areaSqft} sqft
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {flag.reasons.map((r) => (
                        <li
                          key={r.id}
                          title={r.detail}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold",
                            REASON_META[r.id].tone
                          )}
                        >
                          {REASON_META[r.id].icon}
                          {REASON_META[r.id].label}
                        </li>
                      ))}
                    </ul>
                    {flag.reasons[0] && (
                      <p className="mt-1.5 text-[11.5px] text-ink-500">{flag.reasons[0].detail}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 border-t border-ink-200/70 p-3">
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<Check className="h-3.5 w-3.5" />}
                    onClick={() => decide(flag.propertyId, "cleared")}
                    className="flex-1"
                  >
                    Mark safe
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<X className="h-3.5 w-3.5" />}
                    onClick={() => decide(flag.propertyId, "removed")}
                    className="flex-1 text-rose-600 hover:bg-rose-50"
                  >
                    Remove listing
                  </Button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {visible.length === 0 && (
        <div className="surface-card grid place-items-center px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="h-6 w-6" />
          </span>
          <p className="mt-3 text-[14px] font-bold text-ink-900">Queue is clear</p>
          <p className="mt-1 text-[12.5px] text-ink-500">No flagged listings match this filter.</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label, value, helper, tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: "emerald" | "rose" | "amber" | "violet";
}) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="surface-card p-5">
      <span className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold", toneMap[tone])}>
        {label}
      </span>
      <p className="mt-2.5 text-3xl font-bold text-ink-900">{value.toLocaleString("en-IN")}</p>
      <p className="text-[12px] text-ink-500">{helper}</p>
    </div>
  );
}
