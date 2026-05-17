"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "akp_visit_session_v1";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/**
 * Fires a fire-and-forget beacon to /api/track/visit on every route
 * change, plus a heartbeat every 30 s while the tab is open. Server
 * derives country / city / district from Cloudflare Tunnel headers.
 * Property pages also pass `propertyId` so the visitor's interest
 * history is recorded.
 *
 * Lives in the root layout via <LazyClient> so it never blocks the
 * critical path.
 */
export function VisitBeacon() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (!sessionIdRef.current) sessionIdRef.current = getSessionId();

    const propertyId = pathname.startsWith("/property/")
      ? pathname.split("/")[2]?.split("?")[0]
      : undefined;

    const beat = (extra?: { propertyId?: string }) => {
      try {
        const payload = JSON.stringify({
          sessionId: sessionIdRef.current,
          path: pathname,
          ...(extra?.propertyId ? { propertyId: extra.propertyId } : {}),
        });
        // sendBeacon survives page-unload; falls back to fetch in dev.
        if (navigator.sendBeacon) {
          const ok = navigator.sendBeacon(
            "/api/track/visit",
            new Blob([payload], { type: "application/json" }),
          );
          if (ok) return;
        }
        fetch("/api/track/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* never throw from a beacon */
      }
    };

    // Initial hit on every route change.
    beat({ propertyId });
    // Heartbeat every 30 s so duration stays accurate while the tab is open.
    const t = setInterval(() => beat(), 30_000);
    return () => clearInterval(t);
  }, [pathname]);

  return null;
}
