"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "BUYER" | "SELLER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";

export function UserAdminActions({
  id,
  role,
  suspended,
  isSelf,
  canChangePrivileged,
}: {
  id: string;
  role: Role;
  suspended: boolean;
  isSelf: boolean;
  canChangePrivileged: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "role" | "suspend" | "delete">(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, kind: typeof busy) {
    setBusy(kind);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
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
    if (!confirm("Delete this user? All their listings/leads are cascade-deleted. Cannot be undone.")) return;
    setBusy("delete");
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const roleOptions: Role[] = canChangePrivileged
    ? ["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]
    : ["BUYER", "SELLER", "AGENT"];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <select
        defaultValue={role}
        disabled={!!busy || isSelf}
        onChange={(e) => {
          const next = e.target.value as Role;
          if (next !== role) patch({ role: next }, "role");
        }}
        className="rounded-md border border-ink-200 bg-white px-1.5 py-1 text-[11px] font-semibold focus:border-brand-500 focus:outline-none disabled:opacity-50"
        title={isSelf ? "Cannot change own role" : "Change role"}
      >
        {roleOptions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        {!roleOptions.includes(role) && <option value={role}>{role} (current)</option>}
      </select>
      {!isSelf && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => patch({ suspended: !suspended }, "suspend")}
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-50 ${
            suspended
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          {busy === "suspend" ? "..." : suspended ? "Reactivate" : "Suspend"}
        </button>
      )}
      {canChangePrivileged && !isSelf && (
        <button
          type="button"
          disabled={!!busy}
          onClick={remove}
          className="rounded-md border border-rose-400 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          {busy === "delete" ? "..." : "Delete"}
        </button>
      )}
      {err && <span className="text-[11px] text-rose-700 ml-2">{err}</span>}
    </div>
  );
}
