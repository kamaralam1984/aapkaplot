"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, ShieldCheck, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function BrokerSignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [agencyName, setAgencyName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = agencyName.length >= 2 && city && state;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/broker/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          city: city.trim(),
          state: state.trim(),
          panNumber: panNumber.trim() || undefined,
          reraNumber: reraNumber.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/auth/login?next=/broker/signup");
        return;
      }
      if (res.status === 409) {
        toast.show({ kind: "info", title: "You're already a broker", description: "Heading to your dashboard." });
        router.push("/broker");
        return;
      }
      if (res.status === 503 && data.error === "db_disabled") {
        toast.show({ kind: "info", title: "DB disabled", description: "Admin needs USE_DB=1." });
        return;
      }
      if (!res.ok) {
        toast.show({ kind: "error", title: "Couldn't sign up", description: data.error });
        return;
      }
      toast.show({ kind: "success", title: "Welcome aboard 🎉", description: "Profile created. Time to bring some deals." });
      router.push("/broker");
    } catch {
      toast.show({ kind: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mt-4 flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <Briefcase className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-display-md font-display text-ink-900">Join as a broker</h1>
            <p className="mt-1 max-w-xl text-[14px] text-ink-600">
              Connect buyers with broker-friendly listings and earn <strong className="font-semibold text-emerald-700">1%–2% commission</strong> on accepted offers.
              You only get paid when a deal converts — buyers pay nothing.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 surface-card space-y-5 p-6">
          <Field label="Agency / your name" required>
            <input
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Bose Realty / Anjali Sharma"
              className="input"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City" required>
              <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kolkata" className="input" />
            </Field>
            <Field label="State" required>
              <input required value={state} onChange={(e) => setState(e.target.value)} placeholder="West Bengal" className="input" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="PAN number (optional)" helper="Speeds up commission payouts.">
              <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="input" />
            </Field>
            <Field label="RERA agent number (optional)" helper="Verified RERA brokers get a trust badge.">
              <input value={reraNumber} onChange={(e) => setReraNumber(e.target.value)} placeholder="HIRA/A/HOO/2025/123" className="input" />
            </Field>
          </div>

          <Field label="Short bio (optional)" helper="Shown on your public agent page.">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="10+ years in New Town residential. Specialise in 2–3 BHK ready-to-move."
              className="input min-h-[80px] resize-none"
            />
          </Field>

          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 text-[12.5px] text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Free to join · No platform fee</p>
              <p>AapKaPlot only takes a small platform fee out of paid commissions — you keep the rest.
              See <Link href="/help" className="underline">help/Broker payouts</Link>.</p>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit || submitting}
            className="w-full"
            iconRight={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          >
            {submitting ? "Creating profile…" : "Create broker profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, helper, required, children }: { label: string; helper?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {helper && <p className="mt-1 text-[11.5px] text-ink-500">{helper}</p>}
    </label>
  );
}
