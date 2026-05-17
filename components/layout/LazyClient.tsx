"use client";

import { useEffect, useState } from "react";

/**
 * Defers mounting its children until the browser is idle (or 2 s passes,
 * whichever comes first). Use for global widgets that don't need to be
 * present on first paint — CookieConsent, CompareDock, ServiceWorker
 * registration, analytics consent banners, etc.
 *
 * Why: hydrating these on the critical render path adds 1–2 s to INP on
 * mid-range mobile. Deferring frees the main thread until LCP is painted.
 */
export function LazyClient({
  children,
  delayMs = 2000,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const cb = () => setShow(true);
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(cb, { timeout: delayMs });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(cb, delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  return show ? <>{children}</> : null;
}
