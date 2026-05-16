"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Lock, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RZP_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RZP_SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

const PLAN_META: Record<string, { label: string; priceInr: number; perks: string[] }> = {
  spotlight: { label: "Spotlight · 7 days",  priceInr: 499,  perks: ["Top of search · 7 days", "Highlighted card", "Search analytics"] },
  featured:  { label: "Featured · 30 days",  priceInr: 1499, perks: ["Homepage AI Rec slot", "Verified-priority badge", "Detailed CTR analytics"] },
  turbo:     { label: "Turbo · 30 days",     priceInr: 2999, perks: ["Spotlight + Featured", "Priority moderation", "Dedicated success manager"] },
  premium:   { label: "Premium · per month", priceInr: 999,  perks: ["Unlimited listings", "Homepage placement", "Buyer chat read-receipts"] },
};

const METHODS = [
  { id: "upi",    label: "UPI",            sub: "PhonePe · GPay · Paytm",   icon: <UpiIcon /> },
  { id: "card",   label: "Credit / Debit", sub: "Visa · Mastercard · RuPay", icon: <CardIcon /> },
  { id: "wallet", label: "Wallet",         sub: "Razorpay balance",          icon: <WalletIcon /> },
  { id: "nb",     label: "NetBanking",     sub: "All major banks",            icon: <BankIcon /> },
];

export default function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = params.get("plan") ?? "featured";
  const plan = PLAN_META[planId] ?? PLAN_META.featured;

  const [method, setMethod] = useState<string>("upi");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const gst = Math.round(plan.priceInr * 0.18);
  const total = plan.priceInr + gst;

  const toast = useToast();

  // Preload Razorpay checkout.js so the modal opens instantly on click.
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const pay = async () => {
    setPending(true);
    try {
      // 1. Ask the server to create a Razorpay order (or a simulated one).
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "unauthenticated") {
          router.push(`/auth/login?next=/checkout?plan=${planId}`);
          return;
        }
        throw new Error(data.error ?? "payment_failed");
      }

      track("checkout_started", { plan: planId, mode: data.mode });

      // 2. Real Razorpay flow — open the hosted checkout modal.
      if (data.mode === "razorpay" && data.keyId) {
        const ready = await loadRazorpayScript();
        if (!ready || !window.Razorpay) {
          throw new Error("razorpay_script_failed");
        }
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: data.keyId,
            amount: data.order.amount,
            currency: data.order.currency,
            name: "AapKaPlot",
            description: `${plan.label}`,
            order_id: data.order.id,
            theme: { color: "#10b981" },
            handler: async (response: any) => {
              try {
                const v = await fetch("/api/payments/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id:   response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature:  response.razorpay_signature,
                    plan: planId,
                  }),
                });
                const vData = await v.json();
                if (!v.ok || !vData.ok) throw new Error(vData.error ?? "verify_failed");
                track("checkout_paid", { plan: planId, paymentId: response.razorpay_payment_id });
                toast.show({ kind: "success", title: "Payment received", description: `Plan ${plan.label} active.` });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => {
                track("checkout_cancelled", { plan: planId });
                toast.show({ kind: "info", title: "Payment cancelled" });
                reject(new Error("cancelled"));
              },
            },
            prefill: { name: "", email: "", contact: "" },
            notes: { plan: planId, mode: "test" },
          });
          rzp.open();
        });
      } else {
        // 3. Simulated path — no Razorpay keys configured. Quick demo confirm.
        await new Promise((r) => setTimeout(r, 600));
        toast.show({
          kind: "success",
          title: "Simulated payment",
          description: "Set RAZORPAY_KEY_ID + SECRET to enable real charge.",
        });
      }

      setDone(true);
      setTimeout(() => router.push("/sell"), 1500);
    } catch (err: any) {
      if (err?.message !== "cancelled") {
        console.error("[checkout]", err);
        toast.show({
          kind: "error",
          title: "Payment failed",
          description: err?.message ?? "Please try again.",
        });
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main>
        <Container size="wide" className="py-10 lg:py-14">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to pricing
          </Link>
          <h1 className="mt-3 text-display-md font-display text-ink-900">
            Checkout
          </h1>
          <p className="text-[14px] text-ink-500">
            Pay securely. You can cancel any time.
          </p>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.section
                key="ok"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="surface-card mt-8 grid place-items-center p-12 text-center"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-display-md font-display text-ink-900">Payment received!</h2>
                <p className="mt-2 max-w-sm text-[14px] text-ink-500">
                  Your {plan.label} plan is now active. Taking you back to your seller dashboard…
                </p>
              </motion.section>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]"
              >
                {/* Payment column */}
                <section className="surface-card overflow-hidden">
                  <header className="border-b border-ink-200/70 px-6 py-4">
                    <h2 className="text-[14px] font-bold text-ink-900">Choose payment method</h2>
                    <p className="text-[12px] text-ink-500">All major Indian payment methods supported.</p>
                  </header>
                  <ul className="divide-y divide-ink-200/70">
                    {METHODS.map((m) => {
                      const active = method === m.id;
                      return (
                        <li key={m.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-3 px-6 py-3.5 transition",
                              active ? "bg-brand-50/60" : "hover:bg-ink-100/40"
                            )}
                          >
                            <input
                              type="radio"
                              name="method"
                              checked={active}
                              onChange={() => setMethod(m.id)}
                              className="h-4 w-4 accent-emerald-500"
                            />
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-soft">
                              {m.icon}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[14px] font-bold text-ink-900">{m.label}</span>
                              <span className="block text-[11.5px] text-ink-500">{m.sub}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <footer className="border-t border-ink-200/70 px-6 py-3 text-[11.5px] text-ink-500 inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Razorpay-secured payments · 256-bit TLS
                  </footer>
                </section>

                {/* Summary column */}
                <aside className="surface-card flex flex-col p-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 w-fit">
                    <Sparkles className="h-3 w-3" /> Order summary
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-ink-900">{plan.label}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {plan.perks.map((p) => (
                      <li key={p} className="inline-flex items-start gap-2 text-[13px] text-ink-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <hr className="my-5 border-ink-200/70" />

                  <ul className="space-y-2 text-[13.5px]">
                    <li className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-semibold text-ink-900">{formatInr(plan.priceInr)}</span></li>
                    <li className="flex justify-between"><span className="text-ink-500">GST (18%)</span><span className="font-semibold text-ink-900">{formatInr(gst)}</span></li>
                    <li className="flex justify-between border-t border-ink-200/70 pt-2 text-[16px] font-bold text-ink-900"><span>Total</span><span>{formatInr(total)}</span></li>
                  </ul>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={pay}
                    disabled={pending}
                    className="mt-6 w-full"
                    iconRight={pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  >
                    {pending ? "Processing…" : `Pay ${formatInr(total)}`}
                  </Button>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-ink-500">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    100% refund within 24 hours if you change your mind.
                  </p>
                </aside>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function UpiIcon()    { return <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-600" fill="currentColor"><path d="M12 2 4 22h6l4-10 2 6h6L18 2zm0 3.4 4.5 12.2H13.7L12 13.5l-1.6 4.1H7.5z"/></svg>; }
function CardIcon()   { return <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-4h10l2 4M17 13h2"/></svg>; }
function BankIcon()   { return <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18M12 3l9 5H3z"/></svg>; }
