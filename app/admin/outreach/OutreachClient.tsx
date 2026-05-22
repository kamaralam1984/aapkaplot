"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Prospect = {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string;
  phone: string | null;
  city: string;
  businessType: string;
  propertyTypes: string[];
  websiteUrl: string | null;
  listingCount: number;
  estimatedBudget: number;
  interestScore: number;
  interestLabel: string;
  aiReason: string | null;
  status: string;
  emailSentAt: string | null;
  notes: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  pending: number;
  emailed: number;
  replied: number;
  converted: number;
  hot: number;
  warm: number;
  cold: number;
  avgScore: number;
};

type Props = {
  prospects: Prospect[];
  stats: Stats;
};

function ScorePill({ score, label }: { score: number; label: string }) {
  const color =
    label === "hot"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : label === "warm"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-sky-100 text-sky-700 border-sky-200";
  const barColor = label === "hot" ? "bg-rose-500" : label === "warm" ? "bg-amber-500" : "bg-sky-400";

  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${color}`}>
        {score}%
      </span>
      <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-ink-100 text-ink-600",
    emailed: "bg-blue-100 text-blue-700",
    replied: "bg-emerald-100 text-emerald-700",
    converted: "bg-violet-100 text-violet-700",
    unsubscribed: "bg-rose-100 text-rose-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-ink-100 text-ink-600"}`}>
      {status}
    </span>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-[13px] font-semibold shadow-lg text-white ${
        type === "success" ? "bg-emerald-600" : "bg-rose-600"
      }`}
    >
      {message}
    </div>
  );
}

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Noida", "Gurgaon", "Indore", "Bhopal"];
const BUSINESS_TYPES = ["builder", "agent", "developer", "dealer"];

export function OutreachClient({ prospects: initialProspects, stats: initialStats }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Finder state
  const [city, setCity] = useState("Mumbai");
  const [businessType, setBusinessType] = useState("builder");
  const [count, setCount] = useState(10);
  const [finding, setFinding] = useState(false);
  const [findResult, setFindResult] = useState<string | null>(null);

  // Table state
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [filterTab, setFilterTab] = useState<"all" | "hot" | "warm" | "cold">("all");

  // Email state
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleFind() {
    setFinding(true);
    setFindResult(null);
    try {
      const res = await fetch("/api/admin/outreach/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, businessType, count }),
      });
      const data = await res.json();
      if (res.ok) {
        setFindResult(`Found ${data.added} prospects in ${city}`);
        if (Array.isArray(data.prospects)) {
          setProspects((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = data.prospects.filter((p: Prospect) => !existingIds.has(p.id));
            return [...newOnes, ...prev];
          });
          setStats((s) => ({ ...s, total: s.total + data.added, pending: s.pending + data.added }));
        }
        showToast(`Added ${data.added} prospects!`, "success");
        refresh();
      } else {
        showToast(data.error ?? "Failed to find prospects", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setFinding(false);
    }
  }

  async function handleEmail(prospectId: string) {
    setEmailingId(prospectId);
    try {
      const res = await fetch("/api/admin/outreach/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Email sent!", "success");
        setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, status: "emailed", emailSentAt: new Date().toISOString() } : p)));
        setStats((s) => ({ ...s, emailed: s.emailed + 1 }));
        refresh();
      } else {
        showToast(data.error ?? "Failed to send email", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setEmailingId(null);
    }
  }

  async function handleDelete(prospectId: string) {
    if (!confirm("Delete this prospect?")) return;
    setDeletingId(prospectId);
    try {
      const res = await fetch(`/api/admin/outreach/${prospectId}`, { method: "DELETE" });
      if (res.ok) {
        setProspects((prev) => prev.filter((p) => p.id !== prospectId));
        setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
        showToast("Prospect deleted", "success");
        refresh();
      } else {
        showToast("Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkEmail(filter: "hot" | "warm") {
    setBulkRunning(filter);
    try {
      const res = await fetch("/api/admin/outreach/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter, limit: 10 }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Sent ${data.sent} emails (${data.failed} failed)`, "success");
        refresh();
      } else {
        showToast(data.error ?? "Bulk email failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setBulkRunning(null);
    }
  }

  const filteredProspects = prospects.filter((p) => {
    if (filterTab === "hot") return p.interestScore >= 80;
    if (filterTab === "warm") return p.interestScore >= 50 && p.interestScore < 80;
    if (filterTab === "cold") return p.interestScore < 50;
    return true;
  });

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* AI Finder Panel */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-ink-200/70 bg-gradient-to-r from-pink-50 to-rose-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-[14px] font-bold text-ink-900">AI Client Finder</h2>
              <p className="text-[12px] text-ink-500">Automatically generate and score real estate prospects using AI</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-semibold text-ink-600">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-semibold text-ink-600">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-semibold text-ink-600">Count</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>{n} prospects</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleFind}
              disabled={finding}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {finding ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scanning AI...
                </>
              ) : (
                "🤖 Find Clients with AI"
              )}
            </button>
          </div>
          {finding && (
            <div className="mt-4 rounded-lg bg-pink-50 border border-pink-200 px-4 py-3 text-[12.5px] text-pink-700">
              <span className="font-semibold">AI is scanning</span> for {count} {businessType}s in {city}... This may take up to 20 seconds.
            </div>
          )}
          {findResult && !finding && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-[12.5px] text-emerald-700 font-semibold">
              {findResult}
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Prospects", value: stats.total, color: "text-ink-900" },
          { label: "Emailed", value: stats.emailed, color: "text-blue-700" },
          { label: "Replied", value: stats.replied, color: "text-emerald-700" },
          { label: "Converted", value: stats.converted, color: "text-violet-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-200 bg-white p-4">
            <p className="text-[11.5px] font-medium text-ink-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5">
          <span className="text-[12px] text-rose-700 font-semibold">🔥 Hot: {stats.hot}</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="text-[12px] text-amber-700 font-semibold">♨️ Warm: {stats.warm}</span>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
          <span className="text-[12px] text-sky-700 font-semibold">❄️ Cold: {stats.cold}</span>
        </div>
        <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5">
          <span className="text-[12px] text-ink-700 font-semibold">Avg Score: {stats.avgScore}%</span>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleBulkEmail("hot")}
          disabled={!!bulkRunning}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
        >
          {bulkRunning === "hot" ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          ) : "📧"}
          Email All Hot Prospects
        </button>
        <button
          onClick={() => handleBulkEmail("warm")}
          disabled={!!bulkRunning}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60"
        >
          {bulkRunning === "warm" ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          ) : "📧"}
          Email All Warm Prospects
        </button>
      </div>

      {/* Prospects Table */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-ink-200/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-bold text-ink-900">Prospects</h2>
            <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink-600">
              {filteredProspects.length}
            </span>
          </div>
          {/* Filter tabs */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {(["all", "hot", "warm", "cold"] as const).map((tab) => {
              const labels: Record<string, string> = { all: "All", hot: "🔥 Hot (80+)", warm: "♨️ Warm (50-79)", cold: "❄️ Cold (<50)" };
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    filterTab === tab
                      ? "bg-ink-900 text-white"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {filteredProspects.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-ink-500">
            No prospects found. Use the AI Finder above to generate some!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-200/70 bg-ink-50/50">
                  <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-ink-500">Business</th>
                  <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-ink-500">City</th>
                  <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-ink-500">Interest</th>
                  <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-ink-500 max-w-[200px]">AI Reason</th>
                  <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-ink-500">Status</th>
                  <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-ink-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200/50">
                {filteredProspects.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-ink-900 truncate max-w-[180px]">{p.businessName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10.5px] font-semibold text-violet-700 capitalize">
                          {p.businessType}
                        </span>
                        {p.ownerName && (
                          <span className="text-[11px] text-ink-500 truncate">{p.ownerName}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-400 mt-0.5 truncate max-w-[180px]">{p.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-ink-700">{p.city}</span>
                      <p className="text-[11px] text-ink-400">{p.listingCount} listings</p>
                    </td>
                    <td className="px-4 py-3">
                      <ScorePill score={p.interestScore} label={p.interestLabel} />
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {p.aiReason ? (
                        <span
                          title={p.aiReason}
                          className="block truncate text-[11.5px] text-ink-600 cursor-help"
                        >
                          {p.aiReason}
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                      {p.emailSentAt && (
                        <p className="text-[10.5px] text-ink-400 mt-1">
                          Sent {new Date(p.emailSentAt).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEmail(p.id)}
                          disabled={emailingId === p.id || p.status === "unsubscribed"}
                          title="Send Email"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11.5px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          {emailingId === p.id ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          ) : (
                            "📧"
                          )}
                          Email
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          title="Delete prospect"
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[13px] text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          {deletingId === p.id ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                          ) : (
                            "🗑️"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
