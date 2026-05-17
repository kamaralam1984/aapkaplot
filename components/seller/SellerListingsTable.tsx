"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, Inbox, Pencil, Rocket, Pause, Play, Trash2, Loader2 } from "lucide-react";
import { formatInr, formatArea } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export interface SellerListingRow {
  id: string;
  title: string;
  coverUrl: string;
  status: string; // ListingStatus uppercase
  priceInr: number;
  areaSqft: number;
  locality: string;
  city: string;
  leadsCount: number;
  createdAt: string;
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE:         "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200/70",
  PAUSED:         "bg-ink-100 text-ink-700 border-ink-200",
  DRAFT:          "bg-ink-100 text-ink-700 border-ink-200",
  SOLD:           "bg-sky-50 text-sky-700 border-sky-200/70",
  REJECTED:       "bg-rose-50 text-rose-700 border-rose-200/70",
};

export function SellerListingsTable({ rows }: { rows: SellerListingRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function toggle(id: string, action: "pause" | "resume") {
    setBusy(id);
    try {
      const r = await fetch("/api/seller/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "failed");
      toast.show({ kind: "success", title: action === "pause" ? "Listing paused" : "Listing live again" });
      startTransition(() => router.refresh());
    } catch (e) {
      toast.show({ kind: "error", title: "Action failed", description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes it from public view. Action is reversible only by an admin.`)) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/seller/property/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error ?? "failed");
      toast.show({ kind: "success", title: "Listing deleted" });
      startTransition(() => router.refresh());
    } catch (e) {
      toast.show({ kind: "error", title: "Delete failed", description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-ink-50/50 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3">Property</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Leads</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200/70">
            {rows.map((p) => {
              const isBusy = busy === p.id;
              const paused = p.status === "PAUSED";
              return (
                <tr key={p.id} className="text-[13.5px] hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <Link href={`/property/${p.id}`} className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        {p.coverUrl ? (
                          <Image src={p.coverUrl} alt={p.title} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[10px] text-ink-400">no image</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">{p.title}</p>
                        <p className="truncate text-[12px] text-ink-500">
                          {p.locality}, {p.city} · {formatArea(p.areaSqft)}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-semibold text-emerald-600">{formatInr(p.priceInr)}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-ink-700">
                      <Inbox className="h-3.5 w-3.5 text-ink-400" />
                      {p.leadsCount.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        STATUS_TONE[p.status] ?? "bg-ink-100 text-ink-700 border-ink-200",
                      )}
                    >
                      {p.status.replace("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <ActionLink href={`/property/${p.id}`} label="View" title="View public page">
                        <Eye className="h-3.5 w-3.5" />
                      </ActionLink>
                      <ActionLink href={`/sell/edit/${p.id}`} label="Edit" title="Edit listing">
                        <Pencil className="h-3.5 w-3.5" />
                      </ActionLink>
                      <ActionLink href={`/sell/boost?id=${p.id}`} label="Boost" title="Boost or feature">
                        <Rocket className="h-3.5 w-3.5" />
                      </ActionLink>
                      <ActionBtn
                        label={paused ? "Resume" : "Pause"}
                        title={paused ? "Make live again" : "Hide from public"}
                        disabled={isBusy || (p.status !== "ACTIVE" && p.status !== "PAUSED")}
                        onClick={() => toggle(p.id, paused ? "resume" : "pause")}
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />)}
                      </ActionBtn>
                      <ActionBtn
                        label="Delete"
                        title="Delete listing"
                        tone="rose"
                        disabled={isBusy}
                        onClick={() => remove(p.id, p.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionLink({ href, label, title, children }: { href: string; label: string; title?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={title ?? label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 bg-white text-ink-700 transition hover:border-brand-500/40 hover:text-brand-700"
    >
      {children}
    </Link>
  );
}

function ActionBtn({
  label, title, onClick, disabled, tone, children,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "rose";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border bg-white transition disabled:opacity-50",
        tone === "rose"
          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : "border-ink-200 text-ink-700 hover:border-brand-500/40 hover:text-brand-700",
      )}
    >
      {children}
    </button>
  );
}
