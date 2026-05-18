"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RowProps {
  id: string;
  slug: string;
  status: string;
  canDelete: boolean;
}

export function SeoRowActions({ id, slug, status, canDelete }: RowProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function call(action: "rebuild" | "improve" | "archive" | "publish" | "delete") {
    if (action === "delete" && !confirm(`Permanently delete /seo/${slug}?\nThis removes the row from DB and Google will eventually drop it.`)) return;
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
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <Link
        href={`/seo/${slug}`}
        target="_blank"
        className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-700 hover:bg-ink-50"
      >
        View
      </Link>
      <button
        onClick={() => call("rebuild")}
        disabled={busy !== null}
        className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
        title="Re-fetch sources and rebuild content. Quality gate still applies."
      >
        {busy === "rebuild" ? "..." : "Rebuild"}
      </button>
      {status === "REJECTED" && (
        <button
          onClick={() => call("improve")}
          disabled={busy !== null}
          className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          title="Rebuild up to 3 times trying different content variations until it passes."
        >
          {busy === "improve" ? "..." : "Improve"}
        </button>
      )}
      {status === "PUBLISHED" && (
        <button
          onClick={() => call("archive")}
          disabled={busy !== null}
          className="rounded-md border border-ink-300 bg-white px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          title="Hide from sitemap (de-index). Keep the row for diagnostics."
        >
          {busy === "archive" ? "..." : "Archive"}
        </button>
      )}
      {status === "ARCHIVED" && (
        <button
          onClick={() => call("publish")}
          disabled={busy !== null}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          title="Re-publish and add back to sitemap."
        >
          {busy === "publish" ? "..." : "Publish"}
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => call("delete")}
          disabled={busy !== null}
          className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          title="Permanently delete this row."
        >
          {busy === "delete" ? "..." : "Delete"}
        </button>
      )}
    </div>
  );
}

export function GenerateBatchButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function go() {
    if (!confirm("Generate the next batch of SEO pages (up to 100)? This calls free APIs (Wikipedia + OSM) and may take 1–3 min.")) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/seo/generate", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(`✗ ${j.error ?? "Failed"}`);
        return;
      }
      setResult(`✓ ${j.published} published · ${j.rejected} rejected · ${Math.round((j.durationMs ?? 0) / 1000)}s`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={go}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-105 disabled:opacity-60"
      >
        {busy ? "Generating…" : "Generate next batch"}
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
    if (!confirm(`Retry building ${count} rejected pages? Each is rebuilt up to 3 times with content variations.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seo/rebuild-rejected", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      alert(j.error ? `Error: ${j.error}` : `Rebuilt ${j.published ?? 0} · still rejected ${j.rejected ?? 0}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
    >
      {busy ? "Working…" : `Rebuild ${count} rejected`}
    </button>
  );
}
