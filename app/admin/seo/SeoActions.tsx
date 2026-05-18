"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Per-row actions
// ─────────────────────────────────────────────────────────────

interface RowProps { id: string; slug: string; status: string; canDelete: boolean }

export function SeoRowActions({ id, slug, status, canDelete }: RowProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function call(action: "rebuild" | "improve" | "archive" | "publish" | "delete") {
    if (action === "delete" && !confirm(`Permanently delete /seo/${slug}?`)) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/seo/${id}/${action === "delete" ? "" : action}`, {
        method: action === "delete" ? "DELETE" : "POST",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error ? `Error: ${j.error}` : `Failed (${res.status})`);
        return;
      }
      startTransition(() => router.refresh());
    } finally { setBusy(null); }
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <Link href={`/seo/${slug}`} target="_blank" className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-700 hover:bg-ink-50">View</Link>
      <button onClick={() => call("rebuild")} disabled={busy !== null}
        className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
        {busy === "rebuild" ? "…" : "Rebuild"}
      </button>
      {status === "REJECTED" && (
        <button onClick={() => call("improve")} disabled={busy !== null}
          className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">
          {busy === "improve" ? "…" : "Improve"}
        </button>
      )}
      {status === "PUBLISHED" && (
        <button onClick={() => call("archive")} disabled={busy !== null}
          className="rounded-md border border-ink-300 bg-white px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50">
          {busy === "archive" ? "…" : "Archive"}
        </button>
      )}
      {status === "ARCHIVED" && (
        <button onClick={() => call("publish")} disabled={busy !== null}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
          {busy === "publish" ? "…" : "Publish"}
        </button>
      )}
      {canDelete && (
        <button onClick={() => call("delete")} disabled={busy !== null}
          className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
          {busy === "delete" ? "…" : "Delete"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top action bar — all bulk operations
// ─────────────────────────────────────────────────────────────

interface TopBarProps { rejectedCount: number; canDelete: boolean }

export function TopActionBar({ rejectedCount, canDelete }: TopBarProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function post(label: string, path: string, opts?: { confirm?: string; superOnly?: boolean }) {
    if (opts?.confirm && !confirm(opts.confirm)) return;
    setBusy(label);
    setToast(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(`✗ ${j.error ?? "Failed"}`);
        return;
      }
      setToast(formatResultToast(label, j));
      router.refresh();
    } finally { setBusy(null); }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Btn label="Refresh" tone="slate" busy={busy} onClick={() => router.refresh()} />
        <Btn label="Generate Trending" tone="violet" busy={busy} onClick={() => post("Generate Trending", "/api/admin/seo/generate-trending", { confirm: "Run trending generation (up to 100 fresh pages)?" })} />
        <Btn label="Promote Top 500" tone="emerald" busy={busy} onClick={() => post("Promote Top 500", "/api/admin/seo/promote?count=500&minScore=50", { confirm: "Promote up to 500 highest-quality rejected pages?" })} />
        <Btn label="Promote ALL" tone="emerald" busy={busy} onClick={() => post("Promote ALL", "/api/admin/seo/promote?count=5000&minScore=50", { confirm: "Promote ALL rejected pages with score ≥50? This bypasses the strict 70+ gate." })} />
        <Btn label="Clean Bad Slugs" tone="amber" busy={busy} onClick={() => post("Clean Bad Slugs", "/api/admin/seo/clean-bad-slugs", { confirm: "Archive every published page whose slug is flagged by the audit?" })} />
        <Btn label="Repair Rejected" tone="amber" busy={busy} onClick={() => post("Repair Rejected", "/api/admin/seo/rebuild-rejected", { confirm: `Rebuild ${rejectedCount} rejected pages (up to 50/batch, 3 attempts each)?` })} disabled={rejectedCount === 0} />
        {canDelete && (
          <Btn label="Delete All Rejected" tone="rose" busy={busy} onClick={() => post("Delete All Rejected", "/api/admin/seo/delete-all-rejected", { confirm: `PERMANENTLY delete ALL ${rejectedCount} rejected pages? This cannot be undone.` })} disabled={rejectedCount === 0} />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Btn label="Rebuild ALL pages" tone="violet" busy={busy} onClick={() => post("Rebuild ALL pages", "/api/admin/seo/rebuild-all?limit=100", { confirm: "Rebuild up to 100 existing pages through the latest composer (theme, chrome, marketing block). Re-run to cover the next 100." })} />
        <Btn label="Recreate Fresh" tone="teal" busy={busy} onClick={() => post("Recreate Fresh", "/api/admin/seo/recreate-fresh?olderThanDays=90", { confirm: "Delete pages older than 90 days and regenerate the next 100 in their place?" })} />
        <Btn label="Run SEO Rerank" tone="sky" busy={busy} onClick={() => post("Run SEO Rerank", "/api/admin/seo/rerank", { confirm: "Re-grade every page against the latest quality logic? Some pages may flip between Published/Rejected." })} />
        <Btn label="Rebuild Themes" tone="violet" busy={busy} onClick={() => post("Rebuild Themes", "/api/admin/seo/rebuild-themes", { confirm: "Re-assign the template variant for every page using the latest pickTemplate() weighting?" })} />
        <Btn label="Sync GSC" tone="slate" busy={busy} onClick={() => post("Sync GSC", "/api/admin/seo/gsc-sync")} />
      </div>
      {toast && (
        <p className={`text-xs ${toast.startsWith("✗") ? "text-rose-600" : "text-emerald-700"}`}>{toast}</p>
      )}
    </div>
  );
}

function formatResultToast(label: string, j: Record<string, unknown>): string {
  if (j.deleted != null) return `✓ ${label}: ${j.deleted} deleted`;
  if (j.promoted != null) return `✓ ${label}: ${j.promoted} promoted`;
  if (j.archived != null) return `✓ ${label}: ${j.archived} archived`;
  if (j.published != null) return `✓ ${label}: ${j.published} published · ${j.rejected ?? 0} rejected`;
  if (j.upgraded != null) return `✓ ${label}: ${j.upgraded}↑ · ${j.downgraded ?? 0}↓ · ${j.unchanged ?? 0}=`;
  if (j.changed != null) return `✓ ${label}: ${j.changed} updated`;
  if (j.matched != null) return `✓ ${label}: ${j.matched} GSC rows matched`;
  if (j.flagged != null) return `✓ ${label}: ${j.flagged} flagged · ${j.cleared ?? 0} clean`;
  if (j.deletedStale != null) return `✓ ${label}: cleared ${j.deletedStale} stale + generated ${(j.fresh as Record<string, unknown>)?.published ?? 0}`;
  if (j.reason) return `⚠ ${label}: ${String(j.reason).slice(0, 80)}`;
  return `✓ ${label}: done`;
}

interface BtnProps {
  label: string;
  tone: "rose" | "emerald" | "amber" | "violet" | "sky" | "slate" | "teal";
  busy: string | null;
  onClick: () => void;
  disabled?: boolean;
}
function Btn({ label, tone, busy, onClick, disabled }: BtnProps) {
  const TONE: Record<BtnProps["tone"], string> = {
    rose:    "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    amber:   "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
    violet:  "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100",
    sky:     "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
    slate:   "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    teal:    "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100",
  };
  return (
    <button onClick={onClick} disabled={!!busy || !!disabled}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${TONE[tone]}`}>
      {busy === label ? "…" : label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Below quality control
// ─────────────────────────────────────────────────────────────

export function DeleteBelowControl({ canDelete }: { canDelete: boolean }) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(40);
  const [includeIndexable, setIncludeIndexable] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!canDelete) return null;

  async function go() {
    const scope = includeIndexable ? "INCLUDING indexable pages" : "(rejected/archived/pending only)";
    if (!confirm(`Delete every page with quality score below ${threshold} ${scope}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/seo/delete-below?threshold=${threshold}&includeIndexable=${includeIndexable ? 1 : 0}`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      alert(j.error ? `Error: ${j.error}` : `Deleted ${j.deleted ?? 0} pages.`);
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50/40 ring-1 ring-amber-200/60 p-3">
      <label className="text-xs font-semibold text-amber-800">Bulk delete below quality:</label>
      <select
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className="h-9 rounded-lg border border-amber-300 bg-white px-2 text-sm font-semibold text-amber-800"
      >
        {[20, 30, 40, 50, 60, 70].map((t) => <option key={t} value={t}>≤ {t} quality</option>)}
      </select>
      <button onClick={go} disabled={busy}
        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
        {busy ? "Deleting…" : "Delete Below"}
      </button>
      <label className="ml-2 inline-flex items-center gap-2 text-xs text-ink-700">
        <input type="checkbox" checked={includeIndexable} onChange={(e) => setIncludeIndexable(e.target.checked)} className="h-4 w-4" />
        Indexable bhi delete karo
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GSC + Audit panels (used by page.tsx)
// ─────────────────────────────────────────────────────────────

export function GscPanel({
  status, summary, reason,
}: {
  status: "ok" | "notConfigured" | "error";
  summary: { range: { start: string; end: string }; rows: number; clicks: number; impressions: number } | null;
  reason: string;
}) {
  const tone = status === "ok" ? "bg-emerald-50 text-emerald-700" :
               status === "notConfigured" ? "bg-amber-50 text-amber-800" :
                                            "bg-rose-50 text-rose-700";
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-200/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">🌐 Google Search Console (last 28 days)</p>
        <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase ${tone}`}>{status === "ok" ? "Synced" : status === "notConfigured" ? "Not configured" : "Error"}</span>
      </div>
      {status === "ok" && summary && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Mini label="URLs" value={summary.rows} />
          <Mini label="Clicks" value={summary.clicks} />
          <Mini label="Impressions" value={summary.impressions} />
        </div>
      )}
      {status !== "ok" && (
        <p className="mt-2 text-xs text-ink-600 leading-relaxed">{reason || "Not configured."}</p>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-xl font-semibold text-ink-900 tabular-nums">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export function AuditPanel({ flaggedCount }: { flaggedCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seo/audit", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      alert(j.error ? `Error: ${j.error}` : `Audit done: ${j.flagged ?? 0} flagged · ${j.cleared ?? 0} clean`);
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-200/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">🛡 Slug Quality Audit</p>
        <button onClick={go} disabled={busy}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">
          {busy ? "Running…" : "Run Audit"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-600 leading-relaxed">
        Scans every slug for repeated tokens (<code>best-best-best</code>), year stacks, junk fragments and length issues.
        Bad slugs are <strong>flagged</strong> — not deleted. Use <strong>Clean Bad Slugs</strong> above to demote them from the sitemap.
      </p>
      <p className="mt-3 text-sm">
        <span className={flaggedCount > 0 ? "text-rose-700 font-semibold" : "text-emerald-700 font-semibold"}>
          {flaggedCount} flagged
        </span>{" "}
        <span className="text-ink-500">currently in DB</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Legacy buttons kept for the bottom area
// ─────────────────────────────────────────────────────────────

export function GenerateBatchButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  async function go() {
    if (!confirm("Generate the next batch of SEO pages (up to 100)? Takes 1–3 min.")) return;
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/admin/seo/generate", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      setResult(res.ok ? `✓ ${j.published} published · ${j.rejected} rejected · ${Math.round((j.durationMs ?? 0) / 1000)}s` : `✗ ${j.error ?? "Failed"}`);
      router.refresh();
    } finally { setBusy(false); }
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={go} disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-105 disabled:opacity-60">
        {busy ? "Generating…" : "Generate next batch (100)"}
      </button>
      {result && <span className="text-xs text-ink-600">{result}</span>}
    </div>
  );
}

export function BulkRebuildRejectedButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (count === 0) return null;
  async function go() {
    if (!confirm(`Retry building ${count} rejected pages?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seo/rebuild-rejected", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      alert(j.error ? `Error: ${j.error}` : `Rebuilt ${j.published ?? 0} · still rejected ${j.rejected ?? 0}`);
      router.refresh();
    } finally { setBusy(false); }
  }
  return (
    <button onClick={go} disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60">
      {busy ? "Working…" : `Rebuild ${count} rejected`}
    </button>
  );
}
