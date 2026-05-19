"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getFirebaseAuth,
  isFirebasePhoneEnabled,
} from "@/lib/firebase-client";

const PHONE_REGEX = /^[6-9][0-9]{9}$/;

export function PhoneLoginPanel({ next }: { next: string }) {
  const router = useRouter();
  const enabled = isFirebasePhoneEnabled();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<import("firebase/auth").ConfirmationResult | null>(null);
  const recaptchaRef = useRef<import("firebase/auth").RecaptchaVerifier | null>(null);

  // Tear down the invisible reCAPTCHA when the panel unmounts so re-entry
  // doesn't double-bind to the same DOM node.
  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  const phoneValid = PHONE_REGEX.test(phone);
  const codeValid = /^[0-9]{6}$/.test(code);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneValid) {
      setError("Please enter a 10-digit Indian mobile number");
      return;
    }
    setPending(true);
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("firebase_not_configured");

      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "akp-recaptcha", {
          size: "invisible",
        });
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        recaptchaRef.current,
      );
      confirmationRef.current = confirmation;
      setStage("code");
    } catch (err) {
      const msg = (err as Error).message ?? "Could not send code";
      setError(msg.includes("too-many") ? "Too many requests. Try again later." : msg);
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!codeValid || !confirmationRef.current) {
      setError("Enter the 6-digit code");
      return;
    }
    setPending(true);
    try {
      const result = await confirmationRef.current.confirm(code);
      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "verify_failed");
      router.push(next);
    } catch (err) {
      setError((err as Error).message ?? "Invalid code");
      setPending(false);
    }
  };

  if (!enabled) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-3 text-[13px] text-amber-800">
        Phone login isn't configured yet. Use email above.
      </p>
    );
  }

  return (
    <form onSubmit={stage === "phone" ? sendCode : verifyCode} className="space-y-3">
      {stage === "phone" ? (
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            Mobile number
          </span>
          <div className="mt-1.5 flex h-12 rounded-xl border border-ink-200 bg-white shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring">
            <span className="inline-flex items-center gap-1.5 border-r border-ink-200 px-3 text-[14px] font-semibold text-ink-800">
              <Phone className="h-4 w-4 text-brand-500" /> +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98xxxxxxxx"
              className="flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-400 focus:outline-none"
              autoFocus
            />
          </div>
        </label>
      ) : (
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            6-digit code sent to +91 {phone}
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="mt-1.5 h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-center text-[20px] font-semibold tracking-[0.4em] shadow-soft focus:border-brand-500 focus:shadow-ring focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => { setStage("phone"); setCode(""); setError(null); }}
            className="mt-2 text-[12px] text-brand-600 hover:underline"
          >
            ← change number
          </button>
        </label>
      )}

      {error && (
        <p className="inline-flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={pending || (stage === "phone" ? !phoneValid : !codeValid)}
        className="w-full"
        iconRight={
          pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />
        }
      >
        {pending
          ? stage === "phone" ? "Sending..." : "Verifying..."
          : stage === "phone" ? "Send code" : "Verify & continue"}
      </Button>

      {/* Anchor for Firebase's invisible reCAPTCHA */}
      <div id="akp-recaptcha" />
    </form>
  );
}
