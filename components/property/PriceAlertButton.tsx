"use client";
import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props { propertyId: string; priceInr: number; }

export function PriceAlertButton({ propertyId, priceInr }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "on">("idle");
  const toast = useToast();

  const toggle = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: `Price drop alert — property ${propertyId.slice(-6)}`,
          query: { propertyId, priceThreshold: priceInr },
          frequency: "instant",
        }),
      });
      if (res.status === 401) { window.location.href = `/auth/login?next=/property/${propertyId}`; return; }
      if (res.ok) {
        setState("on");
        toast.show({ kind: "success", title: "Alert set!", description: "We'll notify you if this property's price drops." });
      } else {
        setState("idle");
        toast.show({ kind: "error", title: "Couldn't set alert", description: "Please try again." });
      }
    } catch {
      setState("idle");
      toast.show({ kind: "error", title: "Error", description: "Check your connection." });
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={state === "loading" || state === "on"}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition ${
        state === "on"
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50"
      }`}
    >
      {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> :
       state === "on" ? <BellOff className="h-4 w-4" /> :
       <Bell className="h-4 w-4" />}
      {state === "on" ? "Alert active" : "Notify me of price drop"}
    </button>
  );
}
