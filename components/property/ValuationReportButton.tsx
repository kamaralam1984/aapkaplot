"use client";

import { useState } from "react";
import { FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";
import { loadRazorpay, openRazorpay } from "@/lib/razorpay-checkout";
import type { RazorpayResponse } from "@/lib/razorpay-checkout";

interface ValuationReportButtonProps {
  propertyId: string;
  priceInr: number;
  locality: string;
  city: string;
}

export function ValuationReportButton({ propertyId, priceInr, locality, city }: ValuationReportButtonProps) {
  const [state, setState] = useState<"idle" | "paying" | "generating" | "done">("idle");
  const toast = useToast();

  const handleClick = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) { toast.show({ kind: "error", title: "Payment unavailable" }); return; }

    setState("paying");
    try {
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "VALUATION", propertyId }),
      });
      if (orderRes.status === 401) { window.location.href = `/auth/login?next=/property/${propertyId}`; return; }
      if (!orderRes.ok) { toast.show({ kind: "error", title: "Setup failed" }); setState("idle"); return; }

      const { orderId, amount, keyId } = await orderRes.json();
      await new Promise<void>((resolve, reject) => {
        openRazorpay({
          key: keyId, amount, currency: "INR", name: "AapKaPlot",
          description: "AI Property Valuation Report (PDF)",
          order_id: orderId, theme: { color: "#7c3aed" },
          handler: async (r: RazorpayResponse) => {
            const vr = await fetch("/api/payments/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature, plan: "VALUATION", propertyId }),
            });
            if (vr.ok) {
              setState("generating");
              track("valuation_purchased", { propertyId });
              // Generate and download PDF
              const pdfRes = await fetch(`/api/ai/valuation?propertyId=${propertyId}&download=1`);
              if (pdfRes.ok) {
                const blob = await pdfRes.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `aapkaplot-valuation-${propertyId.slice(-6)}.pdf`;
                a.click(); URL.revokeObjectURL(url);
                setState("done");
                toast.show({ kind: "success", title: "Report downloaded!", description: "Check your downloads folder." });
              } else {
                // Fallback: show valuation inline
                setState("done");
                toast.show({ kind: "success", title: "Payment successful!", description: "Valuation report ready below." });
              }
            } else { toast.show({ kind: "error", title: "Verification failed" }); setState("idle"); }
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("dismissed")) },
        });
      }).catch(() => setState("idle"));
    } catch { setState("idle"); }
  };

  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100">
          <FileText className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-violet-900">AI Valuation Report</p>
          <p className="mt-0.5 text-[12px] text-violet-700">
            Market value · Price history · {locality}, {city} comparison · Investment outlook
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="md"
        className="mt-3 w-full bg-violet-600 hover:bg-violet-700"
        onClick={handleClick}
        disabled={state === "paying" || state === "generating"}
        iconLeft={
          state === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> :
          state === "done" ? <Download className="h-4 w-4" /> :
          state === "paying" ? <Loader2 className="h-4 w-4 animate-spin" /> :
          <FileText className="h-4 w-4" />
        }
      >
        {state === "generating" ? "Generating PDF…" :
         state === "done" ? "Download Again" :
         state === "paying" ? "Processing…" :
         "Get Report · ₹199"}
      </Button>
      <p className="mt-1.5 text-center text-[10.5px] text-violet-400">
        Instant PDF · AI-powered market analysis
      </p>
    </div>
  );
}
