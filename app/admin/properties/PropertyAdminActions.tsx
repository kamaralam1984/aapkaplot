"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Status = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "PAUSED" | "SOLD" | "REJECTED";

export function PropertyAdminActions({
  id,
  status,
  verified,
  canDelete,
}: {
  id: string;
  status: Status;
  verified: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject" | "verify" | "pause" | "delete">(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, kind: typeof busy) {
    setBusy(kind);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this property permanently? This cannot be undone.")) return;
    setBusy("delete");
    setErr(null);
    try {
      const r = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/property/${id}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-ink-50"
        title="View public page"
      >
        View
      </Link>
      <Link
        href={`/admin/properties/edit/${id}`}
        className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
        title="Edit listing details"
      >
        Edit
      </Link>
      {status === "PENDING_REVIEW" && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ status: "ACTIVE", verified: true }, "approve")}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "approve" ? "..." : "Approve"}
        </button>
      )}
      {status !== "REJECTED" && status !== "SOLD" && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ status: "REJECTED" }, "reject")}
          className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
        >
          {busy === "reject" ? "..." : "Reject"}
        </button>
      )}
      {!verified && status === "ACTIVE" && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ verified: true }, "verify")}
          className="rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
        >
          {busy === "verify" ? "..." : "Verify"}
        </button>
      )}
      {status === "ACTIVE" && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ status: "PAUSED" }, "pause")}
          className="rounded-md border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
        >
          {busy === "pause" ? "..." : "Pause"}
        </button>
      )}
      {status === "PAUSED" && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ status: "ACTIVE" }, "approve")}
          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "approve" ? "..." : "Resume"}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          disabled={!!busy}
          onClick={remove}
          title="Super admin only"
          className="rounded-md border border-rose-400 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          {busy === "delete" ? "..." : "Delete"}
        </button>
      )}
      {err && <span className="text-[11px] text-rose-700 ml-2">{err}</span>}
    </div>
  );
}
