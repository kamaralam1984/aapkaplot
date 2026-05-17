"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User, ArrowRight, Loader2, AlertCircle, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/auth/Turnstile";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

type Role = "buyer" | "seller" | "agent";

export default function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/me";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const nameValid = name.trim().length >= 2;
  const emailValid = EMAIL_REGEX.test(email);
  const phoneValid = PHONE_REGEX.test(phoneDigits);
  const addressValid = address.trim().length >= 6;
  const formValid = nameValid && emailValid && phoneValid && addressValid;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nameValid) return setError("Please enter your full name (min 2 chars).");
    if (!phoneValid) return setError("Enter a valid 10-digit Indian mobile (starts with 6-9).");
    if (!emailValid) return setError("Please enter a valid email address.");
    if (!addressValid) return setError("Please enter your address (min 6 chars).");
    if (turnstileRequired && !turnstileToken) {
      return setError("Please complete the bot-check first.");
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "bot_check_failed") {
          throw new Error("Bot check failed — please retry the puzzle.");
        }
        throw new Error(data.error ?? "send_failed");
      }
      const q = new URLSearchParams({ email, next });
      q.set("name", name.trim());
      q.set("phone", phoneDigits);
      q.set("address", address.trim());
      if (role !== "buyer") q.set("role", role);
      if (data.devHint) q.set("hint", data.devHint);
      router.push(`/auth/verify?${q.toString()}`);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
      setPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-display-md font-display text-ink-900">Create your account</h1>
      <p className="mt-2 text-[14.5px] text-ink-600">
        Fill in your details — we&apos;ll send a 6-digit code to your email to confirm it.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        {/* Full name */}
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            Full name
          </span>
          <div className="mt-1.5 flex h-12 rounded-xl border border-ink-200 bg-white shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring">
            <span className="inline-flex items-center gap-1.5 border-r border-ink-200 px-3 text-[14px] font-semibold text-ink-800">
              <User className="h-4 w-4 text-brand-500" />
            </span>
            <input
              type="text"
              required
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Your full name"
              className="flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </label>

        {/* Phone number */}
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            Phone number
          </span>
          <div className="mt-1.5 flex h-12 rounded-xl border border-ink-200 bg-white shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring">
            <span className="inline-flex items-center gap-1.5 border-r border-ink-200 px-3 text-[14px] font-semibold text-ink-800">
              <Phone className="h-4 w-4 text-brand-500" />
              +91
            </span>
            <input
              type="tel"
              required
              autoComplete="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s]/g, "").slice(0, 14))}
              placeholder="10-digit mobile"
              className="flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-400 focus:outline-none"
            />
          </div>
          {phone && !phoneValid && (
            <span className="mt-1 block text-[11.5px] text-rose-600">
              Must be a 10-digit Indian mobile starting with 6, 7, 8 or 9.
            </span>
          )}
        </label>

        {/* Email */}
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            Email address
          </span>
          <div className="mt-1.5 flex h-12 rounded-xl border border-ink-200 bg-white shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring">
            <span className="inline-flex items-center gap-1.5 border-r border-ink-200 px-3 text-[14px] font-semibold text-ink-800">
              <Mail className="h-4 w-4 text-brand-500" />
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim().slice(0, 120))}
              placeholder="you@example.com"
              className="flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </label>

        {/* Address */}
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            Address
          </span>
          <div className="mt-1.5 flex rounded-xl border border-ink-200 bg-white shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring">
            <span className="inline-flex items-start gap-1.5 border-r border-ink-200 px-3 pt-3 text-[14px] font-semibold text-ink-800">
              <MapPin className="h-4 w-4 text-brand-500" />
            </span>
            <textarea
              required
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 240))}
              placeholder="House / flat, street, locality, city, state, PIN"
              rows={3}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </label>

        {/* Role */}
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
            I am a
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["buyer", "seller", "agent"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`h-11 rounded-xl border text-[13px] font-semibold capitalize transition ${
                  role === r
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </label>

        {error && (
          <p className="inline-flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <Turnstile onToken={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending || !formValid || (turnstileRequired && !turnstileToken)}
          className="w-full"
          iconRight={
            pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />
          }
        >
          {pending ? "Sending code..." : "Send code"}
        </Button>
      </form>

      <p className="mt-8 text-center text-[13px] text-ink-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
