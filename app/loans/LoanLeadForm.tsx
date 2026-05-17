"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function LoanLeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loanAmount, setLoanAmount] = useState<number>(5_000_000);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || phone.length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/visit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "loan-enquiry",
          name,
          phone: `+91${phone.replace(/\D/g, "")}`,
          slot: "loan-callback",
          note: `Home-loan enquiry · ₹${loanAmount.toLocaleString("en-IN")} · ${city || "city not provided"}`,
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      setDone(true);
      toast.show({ kind: "success", title: "Request received", description: "A loan advisor will call within 24h." });
    } catch {
      toast.show({ kind: "error", title: "Network error", description: "Please retry." });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="surface-card grid place-items-center p-8 text-center">
        <p className="text-display-md font-display text-ink-900">Got it ✓</p>
        <p className="mt-2 max-w-sm text-[13px] text-ink-500">
          A partner-bank loan advisor will reach out on +91 {phone} within 24 hours
          with rate quotes tailored to your profile.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="surface-card grid gap-3 p-6">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">Get callback</p>
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="input"
      />
      <div className="flex h-11 rounded-xl border border-ink-200 bg-white shadow-soft focus-within:border-brand-500 focus-within:shadow-ring">
        <span className="grid w-12 place-items-center border-r border-ink-200 text-[13px] font-semibold text-ink-700">+91</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit phone"
          className="flex-1 bg-transparent px-3 text-[14px] focus:outline-none"
        />
      </div>
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City (e.g. Kolkata)"
        className="input"
      />
      <label className="block">
        <span className="text-[12.5px] font-semibold text-ink-700">Loan amount (₹)</span>
        <input
          type="range"
          min={500_000}
          max={100_000_000}
          step={100_000}
          value={loanAmount}
          onChange={(e) => setLoanAmount(Number(e.target.value))}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-emerald-500"
        />
        <p className="mt-1 text-[12px] font-bold text-emerald-700">
          ₹{loanAmount.toLocaleString("en-IN")}
        </p>
      </label>
      <Button
        variant="primary"
        size="lg"
        type="submit"
        disabled={submitting || phone.length < 10 || !name}
        iconRight={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      >
        {submitting ? "Sending…" : "Request callback"}
      </Button>
      <p className="text-[11px] text-ink-500">
        Free service. We don't charge buyers — partner banks pay a referral fee on disbursal.
      </p>
    </form>
  );
}
