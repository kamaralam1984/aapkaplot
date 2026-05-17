"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Plus, ArrowRight, Zap, Sun, CalendarDays, Loader2, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { Button } from "@/components/ui/Button";
import { MOCK_SEARCH_ALERTS } from "@/lib/mock-dashboard";
import { useToast } from "@/components/ui/Toast";

type Frequency = "instant" | "daily" | "weekly";

interface ApiAlert {
  id: string;
  label: string;
  query: Record<string, unknown>;
  frequency: Frequency;
  active: boolean;
  createdAt: string;
  lastSentAt: string | null;
}

const FREQ_ICON: Record<Frequency, React.ReactElement> = {
  instant: <Zap className="h-3.5 w-3.5" />,
  daily: <Sun className="h-3.5 w-3.5" />,
  weekly: <CalendarDays className="h-3.5 w-3.5" />,
};

function describeQuery(q: Record<string, unknown>): string {
  const bits: string[] = [];
  if (q.intent) bits.push(`${q.intent}`);
  if (q.kind) bits.push(`${q.kind}`);
  if (q.city) bits.push(`in ${q.city}`);
  if (q.budgetMin || q.budgetMax) {
    const lo = q.budgetMin ? `₹${Math.round(Number(q.budgetMin) / 1e5)}L` : "any";
    const hi = q.budgetMax ? `₹${Math.round(Number(q.budgetMax) / 1e5)}L` : "any";
    bits.push(`${lo}–${hi}`);
  }
  if (q.bhk) bits.push(`${q.bhk} BHK`);
  return bits.length ? bits.join(" · ") : "All listings";
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ApiAlert[] | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) {
          setUsingMock(true);
          setAlerts([]);
          return;
        }
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      } catch {
        setUsingMock(true);
        setAlerts([]);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this alert?")) return;
    const prev = alerts;
    setAlerts((a) => a?.filter((x) => x.id !== id) ?? []);
    try {
      const res = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      toast.show({ kind: "success", title: "Alert deleted" });
    } catch {
      setAlerts(prev);
      toast.show({ kind: "error", title: "Couldn't delete", description: "Try again." });
    }
  };

  const handleToggleFrequency = async (a: ApiAlert) => {
    const next: Frequency = a.frequency === "instant" ? "daily" : a.frequency === "daily" ? "weekly" : "instant";
    setAlerts((list) => list?.map((x) => (x.id === a.id ? { ...x, frequency: next } : x)) ?? null);
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, frequency: next }),
    }).catch(() => {});
  };

  if (alerts === null) {
    return (
      <div className="flex h-48 items-center justify-center text-ink-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // Use mock as visual seed when nothing real yet — keeps the page from feeling empty in dev.
  const showMockHint = alerts.length === 0 && (usingMock || alerts.length === 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Saved searches"
        title="Property alerts"
        subtitle="We'll notify you instantly when new properties match these searches."
        actions={
          <Link href="/search">
            <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
              New alert
            </Button>
          </Link>
        }
      />

      {alerts.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {alerts.map((a) => (
            <li key={a.id} className="surface-card flex items-start gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <BellRing className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[14px] font-bold text-ink-900">{a.label}</h3>
                  <button
                    type="button"
                    onClick={() => handleToggleFrequency(a)}
                    title="Click to change frequency"
                    className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-700 hover:bg-ink-200"
                  >
                    {FREQ_ICON[a.frequency]} {a.frequency}
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{describeQuery(a.query)}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/search?${new URLSearchParams(
                      Object.entries(a.query).reduce<Record<string, string>>((acc, [k, v]) => {
                        if (v != null && typeof v !== "object") acc[k] = String(v);
                        return acc;
                      }, {})
                    ).toString()}`}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    Run now <ArrowRight className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <DashboardEmpty
          icon={BellRing}
          title="No alerts yet"
          body={
            usingMock
              ? "Sign in and save a search from the filters bar — we'll email you when new properties match."
              : "Run a search and tap “Save this search” to get notified about new matches."
          }
          action={
            <Link href="/search">
              <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
                Create your first alert
              </Button>
            </Link>
          }
        />
      )}

      {showMockHint && (
        <div className="surface-card grid gap-3 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Sample alerts</p>
          <p className="text-[12.5px] text-ink-500">
            What your alerts will look like once you save your first search:
          </p>
          <ul className="grid gap-2">
            {MOCK_SEARCH_ALERTS.slice(0, 2).map((m) => (
              <li key={m.id} className="rounded-xl border border-dashed border-ink-200/70 p-3 text-[12.5px] text-ink-500">
                <strong className="text-ink-700">{m.label}</strong> · {m.filtersDescription}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
