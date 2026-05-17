"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "akp_consent";

type Choice = "all" | "analytics" | "essential";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function applyConsent(choice: Choice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* ignore — Safari private mode etc. */
  }
  if (typeof window === "undefined" || !window.gtag) return;
  if (choice === "all") {
    window.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  } else if (choice === "analytics") {
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
  } else {
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const pick = (c: Choice) => {
    applyConsent(c);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-ink-200 bg-white p-4 shadow-xl backdrop-blur sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700">
          <Cookie className="h-4 w-4" />
        </span>
        <div className="flex-1 text-[13px] text-ink-700">
          <p className="font-semibold text-ink-900">We use cookies</p>
          <p className="mt-1 leading-relaxed">
            We use essential cookies to run AapKaPlot, plus optional analytics
            and advertising cookies (Google Analytics, AdSense) to improve the
            product and show relevant ads. Read our{" "}
            <Link href="/cookies" className="font-semibold text-brand-600 hover:underline">
              cookie policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => pick("all")}
              className="rounded-lg bg-ink-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-ink-800"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => pick("analytics")}
              className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-ink-700 hover:bg-ink-50"
            >
              Analytics only
            </button>
            <button
              type="button"
              onClick={() => pick("essential")}
              className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-ink-700 hover:bg-ink-50"
            >
              Reject non-essential
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => pick("essential")}
          className="text-ink-400 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
