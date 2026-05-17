"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "BUYER" | "SELLER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";

export function NewUserButton({ canCreateAdmins }: { canCreateAdmins: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          phone: phone || undefined,
          role,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "failed");
      setOpen(false);
      setEmail("");
      setName("");
      setPhone("");
      setRole("BUYER");
      router.refresh();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const roleOptions: Role[] = canCreateAdmins
    ? ["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]
    : ["BUYER", "SELLER", "AGENT"];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-ink-800"
      >
        + New user
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
          <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ink-900">Create user</h2>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Account is created with email pre-verified. The user can sign in via OTP at any time.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Email <span className="text-rose-600">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Phone (optional)</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91…"
                  className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-[13px]"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">{err}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-lg border border-ink-200 px-4 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !email}
                className="rounded-lg bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
