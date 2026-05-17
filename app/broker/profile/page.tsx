"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, BadgeCheck, ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ProfileData {
  id: string;
  slug: string;
  agencyName: string;
  city: string;
  state: string;
  panNumber: string | null;
  reraNumber: string | null;
  reraVerified: boolean;
  bio: string | null;
  defaultCommissionPct: number;
  payoutMethod: string | null;
  payoutDetails: { upi?: string; accountNumber?: string; ifsc?: string; holderName?: string } | null;
}

export default function ProfilePage() {
  const [p, setP] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/broker/profile", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setP(data.profile ?? null);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    setSaving(true);
    try {
      const res = await fetch("/api/broker/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: p.agencyName,
          city: p.city,
          state: p.state,
          panNumber: p.panNumber ?? undefined,
          reraNumber: p.reraNumber ?? undefined,
          bio: p.bio ?? undefined,
          defaultCommissionPct: p.defaultCommissionPct,
          payoutMethod: p.payoutMethod as "upi" | "bank" | undefined,
          payoutDetails: p.payoutDetails ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      toast.show({ kind: "success", title: "Profile saved" });
    } catch {
      toast.show({ kind: "error", title: "Couldn't save", description: "Try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!p) {
    return (
      <div className="flex h-48 items-center justify-center text-ink-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={p.reraVerified ? "RERA verified" : "Broker profile"}
        title={p.agencyName}
        subtitle={`Public URL: /agents/${p.slug}`}
      />

      <form onSubmit={save} className="surface-card grid gap-5 p-6">
        {p.reraVerified && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700">
            <BadgeCheck className="h-4 w-4" /> RERA verified — badge live on your listings and profile.
          </div>
        )}

        <Field label="Agency / display name">
          <input value={p.agencyName} onChange={(e) => setP({ ...p, agencyName: e.target.value })} className="input" />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="City">
            <input value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} className="input" />
          </Field>
          <Field label="State">
            <input value={p.state} onChange={(e) => setP({ ...p, state: e.target.value })} className="input" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="PAN number">
            <input value={p.panNumber ?? ""} onChange={(e) => setP({ ...p, panNumber: e.target.value.toUpperCase() })} className="input" />
          </Field>
          <Field label="RERA agent number">
            <input value={p.reraNumber ?? ""} onChange={(e) => setP({ ...p, reraNumber: e.target.value })} className="input" />
          </Field>
        </div>

        <Field label="Bio">
          <textarea
            value={p.bio ?? ""}
            onChange={(e) => setP({ ...p, bio: e.target.value })}
            rows={3}
            className="input min-h-[80px] resize-none"
          />
        </Field>

        <Field label="Default commission %" helper="Used when a listing doesn't override it. Allowed range 0.5–5.0%.">
          <input
            type="number"
            step={0.1}
            min={0.5}
            max={5}
            value={p.defaultCommissionPct}
            onChange={(e) => setP({ ...p, defaultCommissionPct: Number(e.target.value) || 1 })}
            className="input w-24"
          />
        </Field>

        <div className="rounded-2xl border border-ink-200/70 p-4">
          <p className="text-[12.5px] font-semibold uppercase tracking-wider text-ink-500">Payout</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["upi", "bank"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setP({ ...p, payoutMethod: m })}
                className={
                  "rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold capitalize transition " +
                  (p.payoutMethod === m
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40")
                }
              >
                {m}
              </button>
            ))}
          </div>
          {p.payoutMethod === "upi" && (
            <Field label="UPI ID">
              <input
                value={p.payoutDetails?.upi ?? ""}
                onChange={(e) => setP({ ...p, payoutDetails: { ...(p.payoutDetails ?? {}), upi: e.target.value } })}
                placeholder="yourname@okhdfcbank"
                className="input"
              />
            </Field>
          )}
          {p.payoutMethod === "bank" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Account number">
                <input
                  value={p.payoutDetails?.accountNumber ?? ""}
                  onChange={(e) => setP({ ...p, payoutDetails: { ...(p.payoutDetails ?? {}), accountNumber: e.target.value } })}
                  className="input"
                />
              </Field>
              <Field label="IFSC">
                <input
                  value={p.payoutDetails?.ifsc ?? ""}
                  onChange={(e) => setP({ ...p, payoutDetails: { ...(p.payoutDetails ?? {}), ifsc: e.target.value.toUpperCase() } })}
                  className="input"
                />
              </Field>
              <Field label="Account holder name">
                <input
                  value={p.payoutDetails?.holderName ?? ""}
                  onChange={(e) => setP({ ...p, payoutDetails: { ...(p.payoutDetails ?? {}), holderName: e.target.value } })}
                  className="input"
                />
              </Field>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={saving}
          iconRight={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-[12.5px] text-amber-800">
        <strong className="font-semibold inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> RERA verification
        </strong>{" "}
        — drop your RERA agent certificate at <a href="/auth/verify-docs" className="underline">/auth/verify-docs</a>.
        Once an admin approves, your badge goes live across listings and your public agent page.
      </div>
    </div>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {helper && <p className="mt-1 text-[11.5px] text-ink-500">{helper}</p>}
    </label>
  );
}
