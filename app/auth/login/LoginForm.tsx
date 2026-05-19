"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/auth/Turnstile";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/me";

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Turnstile is only required when the site key env var is present;
  // when it's missing the server bypasses verification.
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const emailValid = EMAIL_REGEX.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailValid) {
      setError("Please enter a valid email address");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError("Please complete the bot-check first.");
      return;
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
      if (data.devHint) q.set("hint", data.devHint);
      router.push(`/auth/verify?${q.toString()}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-display-md font-display text-ink-900">
        Welcome back
      </h1>
      <p className="mt-2 text-[14.5px] text-ink-600">
        Enter your email — we'll send you a 6-digit code. No password.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
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
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim().slice(0, 120))}
              placeholder="you@example.com"
              className="flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-400 focus:outline-none"
            />
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
          disabled={pending || !emailValid || (turnstileRequired && !turnstileToken)}
          className="w-full"
          iconRight={
            pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />
          }
        >
          {pending ? "Sending code..." : "Send code"}
        </Button>
      </form>

      <div className="relative my-7 text-center">
        <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-ink-200" />
        <span className="relative bg-white px-3 text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <OAuthBtn provider="google" label="Continue with Google" icon={<GoogleIcon className="h-4 w-4" />} />
      </div>

      <p className="mt-8 text-center text-[13px] text-ink-500">
        New to AapKaPlot?{" "}
        <Link href="/auth/signup" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}

function OAuthBtn({
  provider, label, icon,
}: { provider: "google"; label: string; icon: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setErr(null);
    try {
      // Probe configuration. /providers returns 200 with the provider map
      // when ready, 503 with our hint when next-auth isn't wired up.
      const probe = await fetch(`/api/auth/providers`, { cache: "no-store" });
      if (probe.status === 503) {
        const data = await probe.json().catch(() => ({}));
        setErr(data.hint ?? "OAuth is not configured yet — please use the OTP login above.");
        return;
      }

      // NextAuth signin requires a POST with CSRF. Submit a hidden form so
      // the browser follows the 302 to Google natively (preserves cookies,
      // avoids fetch redirect-mode quirks).
      const csrfRes = await fetch(`/api/auth/csrf`, { cache: "no-store" });
      const { csrfToken } = await csrfRes.json();
      if (!csrfToken) {
        setErr("Couldn't initiate OAuth (no CSRF token).");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/api/auth/signin/${provider}`;

      const csrf = document.createElement("input");
      csrf.type = "hidden";
      csrf.name = "csrfToken";
      csrf.value = csrfToken;
      form.appendChild(csrf);

      // After Google approves, NextAuth lands on /api/auth/oauth-bridge,
      // which decodes the NextAuth JWT, upserts the user in our DB, and
      // issues an `akp_session` cookie so every other route treats them
      // as signed in (instead of just NextAuth seeing them).
      const cb = document.createElement("input");
      cb.type = "hidden";
      cb.name = "callbackUrl";
      cb.value = `${window.location.origin}/api/auth/oauth-bridge?next=/me`;
      form.appendChild(cb);

      document.body.appendChild(form);
      form.submit();
    } catch {
      setErr("OAuth is unavailable right now — please use OTP.");
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[13.5px] font-semibold text-ink-800 shadow-soft transition hover:border-brand-500/40 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {label}
      </button>
      {err && <p className="mt-2 text-[11px] text-amber-700">{err}</p>}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
