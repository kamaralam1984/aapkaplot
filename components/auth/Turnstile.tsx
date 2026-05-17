"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface TurnstileProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

/**
 * Cloudflare Turnstile widget. Renders only when the site key is configured.
 * Loads the script once per page, mounts a div, and bubbles the success
 * token back via `onToken`.
 *
 * Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in `.env.local` to enable.
 */
export function Turnstile({ onToken, onExpire }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    const SCRIPT_ID = "akp-turnstile-script";
    const render = () => {
      const ts = (window as any).turnstile;
      if (!ts || !ref.current) return;
      try {
        widgetIdRef.current = ts.render(ref.current, {
          sitekey: siteKey,
          callback: onToken,
          "error-callback": () => setError("Verification failed — try again."),
          "expired-callback": () => onExpire?.(),
          theme: "light",
          appearance: "always",
        });
      } catch (err) {
        setError("Could not load Turnstile.");
      }
    };

    if (document.getElementById(SCRIPT_ID)) {
      render();
    } else {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = render;
      s.onerror = () => setError("Couldn't reach Turnstile servers.");
      document.head.appendChild(s);
    }

    return () => {
      const ts = (window as any).turnstile;
      if (ts && widgetIdRef.current) {
        try {
          ts.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
    };
  }, [siteKey, onToken, onExpire]);

  // Turnstile not configured → render nothing. The OTP send route still runs
  // with a server-side bypass when TURNSTILE_SECRET is absent (see verify.ts).
  // Showing a developer hint to end users in production looked unprofessional.
  if (!siteKey) return null;

  return (
    <div className="space-y-1">
      <div ref={ref} className="min-h-[65px]" />
      {error ? (
        <p className="inline-flex items-center gap-1 text-[12px] text-rose-700">
          <ShieldAlert className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : (
        <p className="inline-flex items-center gap-1 text-[11px] text-ink-500">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          Protected by Cloudflare Turnstile
        </p>
      )}
    </div>
  );
}
