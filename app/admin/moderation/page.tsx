"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Check, X, ExternalLink, CheckCircle2, Loader2, FileText } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ModerationRow {
  id: string;
  propertyId: string;
  title: string;
  coverUrl: string;
  locality: string;
  city: string;
  priceInr: number;
  trustScore: number;
  verified: boolean;
  ownerName: string | null;
  severity: "low" | "medium" | "high";
  reason: string;
  createdAt: string;
}

type Tab = "open" | "approved" | "rejected";

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>("open");
  const [rows, setRows] = useState<ModerationRow[] | null>(null);
  const [counts, setCounts] = useState<Record<Tab, number>>({ open: 0, approved: 0, rejected: 0 });
  const [busy, setBusy] = useState<string | null>(null);

  // Fetch the active tab + counts of the other two so the tab pills stay in
  // sync without re-rendering the whole queue.
  async function load(active: Tab) {
    setRows(null);
    const [activeRes, openRes, approvedRes, rejectedRes] = await Promise.all([
      fetch(`/api/admin/moderation?status=${active}`, { cache: "no-store" }),
      active === "open"     ? null : fetch(`/api/admin/moderation?status=open`, { cache: "no-store" }),
      active === "approved" ? null : fetch(`/api/admin/moderation?status=approved`, { cache: "no-store" }),
      active === "rejected" ? null : fetch(`/api/admin/moderation?status=rejected`, { cache: "no-store" }),
    ]);
    const activeData = await activeRes.json().catch(() => ({ items: [] }));
    setRows(activeData.items ?? []);
    const lens: Record<Tab, number> = { open: 0, approved: 0, rejected: 0 };
    lens[active] = (activeData.items ?? []).length;
    if (openRes)     lens.open     = ((await openRes.json().catch(() => ({}))).items ?? []).length;
    if (approvedRes) lens.approved = ((await approvedRes.json().catch(() => ({}))).items ?? []).length;
    if (rejectedRes) lens.rejected = ((await rejectedRes.json().catch(() => ({}))).items ?? []).length;
    setCounts(lens);
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed");
      // Optimistic: drop the row from the open list locally.
      setRows((cur) => (cur ?? []).filter((r) => r.id !== id));
      setCounts((c) => ({
        ...c,
        open: Math.max(0, c.open - 1),
        approved: c.approved + (decision === "approve" ? 1 : 0),
        rejected: c.rejected + (decision === "reject" ? 1 : 0),
      }));
    } catch (err) {
      console.error("[moderation] decision failed", err);
      alert("Failed to update — try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Trust & safety"
        title="Moderation queue"
        subtitle="Listings awaiting admin review (Property.status = PENDING_REVIEW). Approve to publish, reject to remove."
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
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold capitalize transition",
                active ? "bg-ink-900 text-white shadow-soft" : "text-ink-700 hover:bg-ink-100/60",
              )}
            >
              {t}
              <span
                className={cn(
                  "ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-ink-100 text-ink-700",
                )}
              >
                {counts[t]}
              </span>
            </button>
          );
        })}
      </div>

      {rows === null ? (
        <div className="surface-card grid place-items-center gap-2 px-5 py-12 text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <p className="text-[13px]">Loading queue…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="surface-card grid place-items-center gap-2 px-5 py-12 text-center text-ink-500">
          <FileText className="h-7 w-7 text-ink-300" />
          <p className="text-[14px] font-semibold text-ink-800">
            {tab === "open" ? "Inbox zero — no listings awaiting review." : `No ${tab} listings yet.`}
          </p>
          <p className="text-[12px]">New submissions land here automatically.</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((m) => (
            <li key={m.id} className="akp-fade-in surface-card overflow-hidden">
              <div className="flex gap-3 p-3">
                <Link href={`/property/${m.propertyId}`} className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  {m.coverUrl ? (
                    <Image src={m.coverUrl} alt={m.title} fill sizes="128px" className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] text-ink-400">no image</div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                        m.severity === "high"
                          ? "bg-rose-50 text-rose-700"
                          : m.severity === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-ink-100 text-ink-700",
                      )}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      {m.severity}
                    </span>
                    <span className="text-[11.5px] text-ink-500">{formatRelativeTime(m.createdAt)}</span>
                  </div>
                  <Link
                    href={`/property/${m.propertyId}`}
                    className="mt-1 block truncate text-[14px] font-bold text-ink-900 hover:underline"
                  >
                    {m.title}
                  </Link>
                  <p className="truncate text-[12px] text-ink-500">
                    {m.locality}, {m.city} · {formatInr(m.priceInr)}
                    {m.ownerName ? ` · ${m.ownerName}` : ""}
                  </p>
                  <p className="mt-2 rounded-lg bg-rose-50/60 px-2.5 py-1.5 text-[12px] font-medium text-rose-700">
                    {m.reason} · trust {m.trustScore}/100
                  </p>
                </div>
              </div>
              {tab === "open" ? (
                <div className="flex gap-2 border-t border-ink-200/70 p-3">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy === m.id}
                    iconLeft={busy === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    onClick={() => decide(m.id, "approve")}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === m.id}
                    iconLeft={<X className="h-3.5 w-3.5" />}
                    onClick={() => decide(m.id, "reject")}
                    className="flex-1 text-rose-600 hover:bg-rose-50"
                  >
                    Reject
                  </Button>
                  <Link
                    href={`/property/${m.propertyId}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-700 hover:border-brand-500/40"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-ink-200/70 px-3 py-2.5 text-[12px]">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold",
                      tab === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700",
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {tab === "approved" ? "Approved" : "Rejected"}
                  </span>
                  <Link
                    href={`/property/${m.propertyId}`}
                    className="text-[11.5px] font-semibold text-ink-500 hover:text-ink-800"
                  >
                    View listing
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
