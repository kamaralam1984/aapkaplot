"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, X, Loader2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatInr } from "@/lib/format";

interface MakeOfferModalProps {
  propertyId: string;
  listingPriceInr: number;
  propertyTitle: string;
}

export function MakeOfferModal({
  propertyId, listingPriceInr, propertyTitle,
}: MakeOfferModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(Math.round(listingPriceInr * 0.95));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const offerPct = listingPriceInr > 0 ? Math.round((amount / listingPriceInr) * 100) : 0;
  const diff = amount - listingPriceInr;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1000) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/lead/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, offerAmountInr: amount, message: message.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast.show({ kind: "info", title: "Sign in to make an offer" });
        router.push(`/auth/login?next=/property/${propertyId}`);
        return;
      }
      if (res.status === 503 && data.error === "db_disabled") {
        toast.show({
          kind: "info",
          title: "Offer noted",
          description: "Live offers need the DB enabled — your input is saved locally.",
        });
        setOpen(false);
        return;
      }
      if (!res.ok) {
        toast.show({ kind: "error", title: "Couldn't send offer", description: data.error });
        return;
      }
      toast.show({
        kind: "success",
        title: "Offer sent",
        description: "Seller will review and respond shortly.",
      });
      setOpen(false);
    } catch {
      toast.show({ kind: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 text-[13.5px] font-bold text-amber-800 transition hover:bg-amber-100"
      >
        <Handshake className="h-4 w-4" />
        Make an offer
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => !submitting && setOpen(false)}
          >
            <motion.form
              initial={{ y: 12, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0 }}
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lift"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Handshake className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-bold text-ink-900">Make an offer</h2>
                  <p className="truncate text-[12.5px] text-ink-500">{propertyTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-ink-200 p-3 text-[12.5px] text-ink-600">
                <span className="font-semibold">Listed at</span>: {formatInr(listingPriceInr)}
              </div>

              <label className="mt-4 block">
                <span className="text-[12.5px] font-semibold text-ink-700">Your offer (₹)</span>
                <div className="mt-1 flex h-12 rounded-xl border border-ink-200 bg-white shadow-soft focus-within:border-brand-500 focus-within:shadow-ring">
                  <span className="grid w-12 place-items-center border-r border-ink-200 text-[14px] font-bold text-ink-700">
                    <IndianRupee className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="flex-1 bg-transparent px-3 text-[15px] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11.5px] text-ink-500">
                  {offerPct}% of asking price ·{" "}
                  <span className={diff < 0 ? "text-emerald-600" : "text-rose-600"}>
                    {diff < 0 ? "−" : "+"}
                    {formatInr(Math.abs(diff))}
                  </span>{" "}
                  vs. listed
                </p>
              </label>

              <label className="mt-3 block">
                <span className="text-[12.5px] font-semibold text-ink-700">Note to seller (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Why your offer makes sense — financing ready, willing to close fast, etc."
                  className="input mt-1 min-h-[72px] resize-none"
                />
              </label>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={submitting || amount < 1000}
                  className="flex-1"
                  iconRight={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                >
                  {submitting ? "Sending…" : "Send offer"}
                </Button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
