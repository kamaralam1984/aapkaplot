"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type State = "loading" | "unsupported" | "denied" | "idle" | "subscribing" | "subscribed";

/**
 * Web push opt-in button.
 *
 * - Hidden when browser doesn't support push or VAPID isn't configured.
 * - One-click subscribe → POST to /api/push/subscribe.
 * - Optional "Test" button after subscription to verify the round trip.
 */
export function PushOptIn({ className }: { className?: string }) {
  const [state, setState] = useState<State>("loading");
  const toast = useToast();

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      // Check if already subscribed.
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setState(sub ? "subscribed" : "idle");
      } catch {
        setState("idle");
      }
    })();
  }, []);

  const urlBase64ToUint8Array = (s: string) => {
    const padding = "=".repeat((4 - (s.length % 4)) % 4);
    const base64 = (s + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  };

  const subscribe = async () => {
    setState("subscribing");
    try {
      // 1. Get the VAPID public key.
      const vapidRes = await fetch("/api/push/subscribe");
      const vapid = await vapidRes.json();
      if (!vapid.vapidPublicKey) {
        toast.show({
          kind: "info",
          title: "Push not configured",
          description: "Admin hasn't enabled VAPID keys yet.",
        });
        setState("idle");
        return;
      }

      // 2. Make sure the service worker is ready.
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 3. Subscribe.
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.vapidPublicKey),
      });

      const subJson = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("subscription_missing_keys");
      }

      // 4. Persist on the server.
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          userAgent: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!saveRes.ok) throw new Error("save_failed");

      setState("subscribed");
      toast.show({ kind: "success", title: "Notifications enabled" });
    } catch (err) {
      console.error("[push] subscribe_failed", err);
      toast.show({
        kind: "error",
        title: "Couldn't enable notifications",
        description: (err as Error).message,
      });
      setState("idle");
    }
  };

  const test = async () => {
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.show({ kind: "success", title: "Sent", description: `${data.delivered} device(s)` });
    } else {
      toast.show({ kind: "error", title: "Test failed", description: data.error });
    }
  };

  if (state === "loading" || state === "unsupported") return null;

  if (state === "denied") {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-3 text-[12.5px] font-semibold text-ink-400",
          className
        )}
      >
        <BellOff className="h-3.5 w-3.5" />
        Notifications blocked
      </button>
    );
  }

  if (state === "subscribed") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-[12.5px] font-semibold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          Notifications on
        </span>
        <button
          type="button"
          onClick={test}
          className="rounded-lg px-2 py-1 text-[11.5px] font-semibold text-ink-500 hover:bg-ink-100"
        >
          Send test
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={state === "subscribing"}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-[12.5px] font-bold text-white shadow-glow disabled:opacity-60",
        className
      )}
    >
      {state === "subscribing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
      {state === "subscribing" ? "Enabling…" : "Enable notifications"}
    </button>
  );
}
