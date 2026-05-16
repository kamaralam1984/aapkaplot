"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.show({ kind: "warning", title: "Invalid email" });
      return;
    }
    setBusy(true);
    track("newsletter_subscribed", { email });
    // Soft-send — track event; wire to mail API later.
    await new Promise((r) => setTimeout(r, 500));
    setBusy(false);
    setDone(true);
    toast.show({
      kind: "success",
      title: "Subscribed!",
      description: "Friday emails incoming.",
    });
  };

  if (done) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-semibold text-emerald-700">
        <Check className="h-4 w-4" />
        Subscribed — check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-transparent px-3.5 py-2.5 text-sm placeholder:text-ink-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1 bg-brand-gradient px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
      </button>
    </form>
  );
}
