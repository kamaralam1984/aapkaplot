"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const OTP_LENGTH = 6;
const RESEND_SEC = 30;

export default function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = params.get("next") ?? "/me";
  const devHint = params.get("hint") ?? "";
  const name = params.get("name") ?? "";
  const phone = params.get("phone") ?? "";
  const address = params.get("address") ?? "";
  const role = (params.get("role") ?? "buyer") as "buyer" | "seller" | "agent";

  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SEC);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (code.length === OTP_LENGTH && !pending && !success) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    setDigits((cur) => {
      const next = [...cur];
      next[i] = clean;
      return next;
    });
    if (clean && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          name: name || undefined,
          phone: phone || undefined,
          address: address || undefined,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = {
          mismatch: "Wrong code — please try again",
          expired: "Code expired — request a new one",
          "too-many-attempts": "Too many attempts — request a new code",
          "not-found": "No active code — request a new one",
          phone_taken: "This phone number is already registered. Please sign in.",
          email_taken: "This email is already registered. Please sign in.",
          invalid_payload: "Some details look invalid — please go back and fix them.",
        };
        throw new Error(map[data.error] ?? "Verification failed");
      }
      setSuccess(true);
      setTimeout(() => router.push(next), 600);
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setPending(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setError(null);
    await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendIn(RESEND_SEC);
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-display-md font-display text-ink-900">Verified!</h1>
        <p className="mt-2 text-[14px] text-ink-500">Taking you to your dashboard…</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mt-3 text-display-md font-display text-ink-900">Enter the code</h1>
      <p className="mt-2 text-[14.5px] text-ink-600">
        We sent a 6-digit code to <span className="font-semibold text-ink-900">{email}</span>.
      </p>

      <div className="mt-7 flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            disabled={pending}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className="h-14 w-12 rounded-xl border border-ink-200 bg-white text-center text-2xl font-bold tracking-tight text-ink-900 shadow-soft transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 inline-flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {devHint && process.env.NODE_ENV !== "production" && (
        <p className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
          <span className="font-semibold">Dev hint:</span> code is{" "}
          <span className="font-mono font-bold">{devHint}</span>
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={submit}
        disabled={pending || code.length !== OTP_LENGTH}
        className="mt-6 w-full"
        iconRight={pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      >
        {pending ? "Verifying..." : "Verify & Continue"}
      </Button>

      <p className="mt-5 text-center text-[13px] text-ink-500">
        Didn't get a code?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={resendIn > 0}
          className="font-semibold text-brand-600 disabled:text-ink-400 hover:underline"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend now"}
        </button>
      </p>
    </motion.div>
  );
}
