"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, Check, X, Loader2, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected";

interface VRow {
  id: string;
  userId: string;
  status: Status;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string | null;
  selfieUrl: string | null;
  panUrl: string | null;
  titleDocUrl: string | null;
  user: { id: string; name: string | null; phone: string; email: string | null; role: string };
}

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<Status>("pending");
  const [rows, setRows] = useState<VRow[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setRows(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/verifications?status=${tab}`, { cache: "no-store" });
        if (!res.ok) {
          setRows([]);
          return;
        }
        const data = await res.json();
        setRows(data.verifications ?? []);
      } catch {
        setRows([]);
      }
    })();
  }, [tab]);

  const decide = async (id: string, decision: "approve" | "reject") => {
    const note =
      decision === "reject"
        ? prompt("Reviewer note (visible to user):") || undefined
        : undefined;
    setWorking(id);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed");
      toast.show({
        kind: decision === "approve" ? "success" : "info",
        title: decision === "approve" ? "Approved" : "Rejected",
      });
      setRows((cur) => cur?.filter((r) => r.id !== id) ?? []);
    } catch (err) {
      toast.show({
        kind: "error",
        title: "Decision failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Trust & safety"
        title="Identity verifications"
        subtitle="Approve or reject Aadhaar packets submitted by users."
      />

      <div role="tablist" className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={s === tab}
            onClick={() => setTab(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold capitalize transition",
              s === tab ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="flex h-32 items-center justify-center text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <DashboardEmpty
          icon={ShieldCheck}
          title={`No ${tab} verifications`}
          body={
            tab === "pending"
              ? "All caught up — new submissions will appear here."
              : "Nothing in this bucket yet."
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="surface-card overflow-hidden">
              <header className="flex items-center gap-3 border-b border-ink-200/70 bg-white/60 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">
                    {r.user.name ?? r.user.phone ?? r.user.email ?? r.user.id}
                  </p>
                  <p className="truncate text-[11.5px] text-ink-500">
                    {r.user.role.toLowerCase()} · submitted {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                    r.status === "pending" && "bg-amber-50 text-amber-700",
                    r.status === "approved" && "bg-emerald-50 text-emerald-700",
                    r.status === "rejected" && "bg-rose-50 text-rose-700"
                  )}
                >
                  {r.status}
                </span>
              </header>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                <Thumb label="Aadhaar front" url={r.aadhaarFrontUrl} />
                <Thumb label="Aadhaar back" url={r.aadhaarBackUrl} />
                <Thumb label="Selfie" url={r.selfieUrl} />
                <Thumb label="PAN" url={r.panUrl} />
                <Thumb label="Title doc" url={r.titleDocUrl} />
              </div>

              {r.note && (
                <p className="mx-3 mb-3 rounded-lg bg-ink-50 p-2.5 text-[12px] text-ink-700">
                  Note: {r.note}
                </p>
              )}

              {r.status === "pending" && (
                <footer className="flex gap-2 border-t border-ink-200/70 bg-white/60 p-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => decide(r.id, "approve")}
                    disabled={working === r.id}
                    iconLeft={<Check className="h-3.5 w-3.5" />}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decide(r.id, "reject")}
                    disabled={working === r.id}
                    iconLeft={<X className="h-3.5 w-3.5" />}
                    className="flex-1 text-rose-700"
                  >
                    Reject
                  </Button>
                </footer>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumb({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="grid h-24 place-items-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-[11px] text-ink-400">
        No {label.toLowerCase()}
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-ink-100"
    >
      <Image
        src={url}
        alt={label}
        fill
        sizes="200px"
        className="object-cover transition group-hover:scale-105"
        unoptimized
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 text-[10.5px] font-semibold text-white">
        {label}
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}
