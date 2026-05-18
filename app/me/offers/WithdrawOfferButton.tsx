"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";

export function WithdrawOfferButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function withdraw() {
    if (!confirm("Withdraw this offer? The seller will be notified.")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/lead/offer/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, action: "withdraw" }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "failed");
      router.refresh();
    } catch (e) {
      alert(`Couldn't withdraw: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={withdraw}
      disabled={busy}
      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[12px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
      Withdraw
    </button>
  );
}
