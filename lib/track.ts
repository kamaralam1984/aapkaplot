"use client";

/**
 * Lightweight event tracker. Fires-and-forgets to `/api/events/track`.
 * Uses `sendBeacon` when available so events survive page navigation.
 */

const QUEUE: { name: string; props: Record<string, unknown> }[] = [];
let flushScheduled = false;

function flush() {
  if (QUEUE.length === 0) return;
  const batch = QUEUE.splice(0, QUEUE.length);
  for (const evt of batch) {
    const payload = JSON.stringify(evt);
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(
        "/api/events/track",
        new Blob([payload], { type: "application/json" })
      );
    } else {
      fetch("/api/events/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }
}

export function track(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  QUEUE.push({ name, props });
  if (flushScheduled) return;
  flushScheduled = true;
  // Coalesce bursts inside a tick.
  setTimeout(() => {
    flushScheduled = false;
    flush();
  }, 50);
}
