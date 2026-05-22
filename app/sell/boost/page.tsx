"use client";

import { useState, useCallback } from "react";
import { Rocket, Star, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";
import { loadRazorpay, openRazorpay } from "@/lib/razorpay-checkout";
import type { RazorpayResponse } from "@/lib/razorpay-checkout";

const PACKS = [
  { plan: "BOOST_7",  label: "Spotlight", days: 7,  price: 299,  Icon: Star,   light: "bg-amber-50",   text: "text-amber-700",   desc: "Top of search for 7 days in your city" },
  { plan: "BOOST_30", label: "Featured",  days: 30, price: 999,  Icon: Rocket, light: "bg-emerald-50", text: "text-emerald-700", desc: "Homepage + AI Recommendations for 30 days", popular: true },
  { plan: "BOOST_30", label: "Turbo",     days: 30, price: 2499, Icon: Zap,    light: "bg-violet-50",  text: "text-violet-700",  desc: "Spotlight + Featured + priority badge for 30 days" },
] as const;

export default function BoostPage() {
  const [propertyId, setPropertyId] = useState("");
  const [boosting, setBoosting] = useState<string | null>(null);
  const [boosted, setBoosted] = useState<string | null>(null);
  const toast = useToast();

  const handleBoost = useCallback(async (pack: typeof PACKS[number], key: string) => {
    if (!propertyId.trim()) {
      toast.show({ kind: "warning", title: "Property ID required", description: "Paste your listing ID from /sell/listings" });
      return;
    }
    const loaded = await loadRazorpay();
    if (!loaded) { toast.show({ kind: "error", title: "Payment unavailable", description: "Check your connection." }); return; }
    setBoosting(key);
    try {
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pack.plan, propertyId }),
      });
      if (orderRes.status === 401) { window.location.href = "/auth/login?next=/sell/boost"; return; }
      if (!orderRes.ok) { toast.show({ kind: "error", title: "Setup failed", description: "Please try again." }); return; }
      const { orderId, amount, keyId } = await orderRes.json();
      await new Promise<void>((resolve, reject) => {
        openRazorpay({
          key: keyId, amount, currency: "INR", name: "AapKaPlot",
          description: `${pack.label} Boost — ${pack.days} days`,
          order_id: orderId, theme: { color: "#7c3aed" },
          handler: async (r: RazorpayResponse) => {
            const vr = await fetch("/api/payments/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature, plan: pack.plan, propertyId }),
            });
            if (vr.ok) { setBoosted(key); track("listing_boosted", { plan: pack.plan, propertyId }); toast.show({ kind: "success", title: "🚀 Listing Boosted!", description: `Featured for ${pack.days} days.` }); }
            else { toast.show({ kind: "error", title: "Verification failed", description: "Contact support." }); }
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("dismissed")) },
        });
      }).catch(() => {});
    } finally { setBoosting(null); }
  }, [propertyId, toast]);

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Get more leads" title="Boost your listing" subtitle="Premium placement on search, homepage & AI recommendations." />

      <div className="mx-auto max-w-md rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
        <label className="text-[13px] font-semibold text-ink-700">Your Listing ID</label>
        <input
          type="text" value={propertyId} onChange={(e) => setPropertyId(e.target.value.trim())}
          placeholder="e.g. cmpfb0f3n002192zbp..."
          className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 text-[14px] focus:border-brand-500 focus:outline-none"
        />
        <p className="mt-1.5 text-[11.5px] text-ink-400">Find it in <a href="/sell/listings" className="text-brand-600 underline">My Listings</a></p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PACKS.map((p, i) => {
          const key = `${p.plan}_${i}`;
          const isBoosting = boosting === key;
          const isBoosted = boosted === key;
          return (
            <div key={key} className={`surface-card relative overflow-hidden p-5 ${"popular" in p && p.popular ? "ring-2 ring-emerald-500" : ""}`}>
              {"popular" in p && p.popular && <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white">POPULAR</span>}
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${p.light}`}><p.Icon className={`h-5 w-5 ${p.text}`} /></span>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{p.label} · {p.days} days</h3>
              <p className="mt-1 text-[12.5px] text-ink-500">{p.desc}</p>
              <p className="mt-4 text-2xl font-bold text-ink-900">₹{p.price.toLocaleString("en-IN")}</p>
              <Button variant="primary" size="md" className="mt-4 w-full" disabled={isBoosting || isBoosted}
                onClick={() => handleBoost(p, key)}
                iconLeft={isBoosted ? <CheckCircle2 className="h-4 w-4" /> : isBoosting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                {isBoosted ? "Boosted!" : isBoosting ? "Processing…" : "Boost Now"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[12.5px] text-ink-500">Secured by Razorpay · <a href="/pricing" className="font-semibold text-brand-600 hover:underline">See all plans</a></p>
    </div>
  );
}
