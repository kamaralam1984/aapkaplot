"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Check, X, ExternalLink, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { MOCK_MODERATION, getPropertyById, type ModerationItem } from "@/lib/mock-dashboard";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const REASON_LABEL = {
  "fake-photos": "Fake / stolen photos",
  "duplicate": "Duplicate listing",
  "unrealistic-price": "Unrealistic price",
  "spam": "Spam / abuse",
} as const;

type Tab = "open" | "approved" | "rejected";

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>(MOCK_MODERATION);
  const [tab, setTab] = useState<Tab>("open");

  const counts = {
    open: items.filter((i) => i.status === "open").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  const visible = items.filter((i) => i.status === tab);

  const decide = (id: string, status: "approved" | "rejected") => {
    setItems((cur) => cur.map((m) => (m.id === id ? { ...m, status } : m)));
    fetch("/api/admin/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, scope: "moderation", status }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Trust & safety"
        title="Moderation queue"
        subtitle="AI-flagged listings + user reports. Approve, reject, or escalate."
      />

      <div role="tablist" className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
        {(["open", "approved", "rejected"] as const).map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={cn(
                "relative inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold capitalize transition",
                active ? "text-white" : "text-ink-700 hover:bg-ink-100/60"
              )}
            >
              {active && (
                <motion.span
                  layoutId="mod-tab"
                  className="absolute inset-0 rounded-lg bg-ink-900 shadow-soft"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative">
                {t}
                <span
                  className={cn(
                    "ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-ink-100 text-ink-700"
                  )}
                >
                  {counts[t]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {visible.map((m) => {
            const p = getPropertyById(m.propertyId);
            if (!p) return null;
            return (
              <motion.li
                key={m.id}
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
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${
                        m.severity === "high"
                          ? "bg-rose-50 text-rose-700"
                          : m.severity === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-ink-100 text-ink-700"
                      }`}>
                        <ShieldAlert className="h-3 w-3" />
                        {m.severity}
                      </span>
                      <span className="text-[11.5px] text-ink-500">{formatRelativeTime(m.createdAt)}</span>
                    </div>
                    <Link href={`/property/${p.id}`} className="mt-1 block truncate text-[14px] font-bold text-ink-900 hover:underline">
                      {p.title}
                    </Link>
                    <p className="truncate text-[12px] text-ink-500">{p.location.locality}, {p.location.city}</p>
                    <p className="mt-2 rounded-lg bg-rose-50/60 px-2.5 py-1.5 text-[12px] font-medium text-rose-700">
                      Flagged for: {REASON_LABEL[m.reason]}
                    </p>
                  </div>
                </div>
                {m.status === "open" ? (
                  <div className="flex gap-2 border-t border-ink-200/70 p-3">
                    <Button
                      variant="primary"
                      size="sm"
                      iconLeft={<Check className="h-3.5 w-3.5" />}
                      onClick={() => decide(m.id, "approved")}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<X className="h-3.5 w-3.5" />}
                      onClick={() => decide(m.id, "rejected")}
                      className="flex-1 text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                    <Link href={`/property/${p.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-700 hover:border-brand-500/40">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-t border-ink-200/70 px-3 py-2.5 text-[12px]">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold",
                      m.status === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    )}>
                      <CheckCircle2 className="h-3 w-3" />
                      {m.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                    <button
                      type="button"
                      onClick={() => decide(m.id, m.status === "approved" ? "rejected" : "approved")}
                      className="text-[11.5px] font-semibold text-ink-500 hover:text-ink-800"
                    >
                      Reverse
                    </button>
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
