"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

type Plan = "STARTER" | "GROWTH" | "DOMINATOR";

const PLANS: Record<
  Plan,
  { label: string; price: string; priceMonthly: string; amountPaise: number; features: string[]; color: string }
> = {
  STARTER: {
    label: "Starter",
    price: "₹2,999",
    priceMonthly: "₹2,999/month",
    amountPaise: 299900,
    color: "blue",
    features: [
      "5 property listings",
      "AI description generator",
      "WhatsApp leads",
      "Lead dashboard",
    ],
  },
  GROWTH: {
    label: "Growth",
    price: "₹9,999",
    priceMonthly: "₹9,999/month",
    amountPaise: 999900,
    color: "emerald",
    features: [
      "50 property listings",
      "Featured placement",
      "AI buyer matching",
      "WhatsApp auto-reply",
      "Lead scoring",
    ],
  },
  DOMINATOR: {
    label: "Dominator",
    price: "₹49,999",
    priceMonthly: "₹49,999/month",
    amountPaise: 4999900,
    color: "amber",
    features: [
      "Unlimited listings",
      "City sponsorship slot",
      "Dedicated account manager",
      "Guaranteed site visits",
      "Full CRM access",
    ],
  },
};

const BADGE_STYLES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",
  emerald: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
  amber: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
};

const BUTTON_STYLES: Record<string, string> = {
  blue: "bg-blue-600 hover:bg-blue-700",
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  amber: "bg-amber-500 hover:bg-amber-600",
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BuilderSubscribePage() {
  const params = useSearchParams();
  const router = useRouter();
  const planKey = (params.get("plan")?.toUpperCase() ?? "STARTER") as Plan;
  const plan = PLANS[planKey] ?? PLANS.STARTER;

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setLoading(true);

    try {
      // 1. Create order
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!orderRes.ok) {
        const { error: msg } = await orderRes.json();
        throw new Error(msg ?? "Order creation failed");
      }

      const { orderId, amount, keyId: serverKeyId } = await orderRes.json();

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load payment gateway");

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: razorpayKeyId ?? serverKeyId,
          amount,
          currency: "INR",
          name: "AapKaPlot",
          description: `${plan.label} Plan — ${plan.priceMonthly}`,
          order_id: orderId,
          theme: { color: "#18181b" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 4. Verify payment
              const verifyRes = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  plan: planKey,
                }),
              });

              if (!verifyRes.ok) {
                const { error: msg } = await verifyRes.json();
                reject(new Error(msg ?? "Verification failed"));
                return;
              }

              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        });
        rzp.open();
      });

      // 5. Redirect on success
      router.push("/builder/crm?subscribed=true");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      if (msg !== "Payment cancelled") setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 space-y-6">
        {/* Plan badge */}
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${BADGE_STYLES[plan.color]}`}
          >
            {plan.label}
          </span>
          <span className="text-zinc-400 text-xs">Builder Plan</span>
        </div>

        {/* Price */}
        <div>
          <p className="text-4xl font-bold text-zinc-900">{plan.price}</p>
          <p className="text-zinc-500 text-sm mt-0.5">per month + GST</p>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-zinc-700">
              <span className="text-emerald-500 text-base">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <hr className="border-zinc-100" />

        {/* Trust signals */}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">🔒 Secure payment</span>
          <span className="flex items-center gap-1">🧾 GST invoice</span>
          <span className="flex items-center gap-1">✕ Cancel anytime</span>
        </div>

        {/* CTA */}
        {razorpayKeyId ? (
          <button
            onClick={handlePay}
            disabled={loading}
            className={`w-full rounded-xl text-white font-semibold py-3 text-sm transition-colors disabled:opacity-60 ${BUTTON_STYLES[plan.color]}`}
          >
            {loading ? "Processing..." : `Pay ${plan.price} with Razorpay`}
          </button>
        ) : (
          <div className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 text-center">
            <p className="font-medium mb-1">Payment gateway not configured</p>
            <p>
              Contact us to subscribe:{" "}
              <a
                href="mailto:animesh@freedomwithai.com"
                className="text-blue-600 underline"
              >
                animesh@freedomwithai.com
              </a>
            </p>
          </div>
        )}

        {error && (
          <p className="text-rose-600 text-xs text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
