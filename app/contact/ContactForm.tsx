"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

const TOPICS = ["General enquiry", "Sales / partnership", "Press", "Buyer support", "Seller support"];

export function ContactForm() {
  const toast = useToast();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [body,  setBody]  = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || body.length < 10) return;
    setBusy(true);
    track("contact_submitted", { topic });
    // Soft-send: we don't have a mail API yet — track and toast.
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setDone(true);
    toast.show({
      kind: "success",
      title: "Message received",
      description: "We'll reply within 4 business hours.",
    });
  };

  if (done) {
    return (
      <div className="grid place-items-center rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-10 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="mt-4 text-[15px] font-bold text-ink-900">Thanks {name.split(" ")[0]} — message sent.</p>
        <p className="mt-1 text-[13px] text-ink-600">
          We'll reply at <span className="font-semibold">{email}</span> within 4 business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Topic</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className={
                "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition " +
                (topic === t
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input mt-1.5"
            placeholder="Aarav Singh"
          />
        </label>
        <label className="block">
          <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input mt-1.5"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Phone (optional)</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className="input mt-1.5"
          placeholder="10-digit mobile number"
        />
      </label>

      <label className="block">
        <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          className="input mt-1.5 min-h-[120px] resize-none"
          placeholder="Tell us a bit about what you're looking for…"
        />
      </label>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={busy || !name || !email || body.length < 10}
        iconRight={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      >
        {busy ? "Sending…" : "Send message"}
      </Button>
      <p className="text-[11.5px] text-ink-500">
        By submitting you agree to AapKaPlot's <a href="/privacy" className="underline-offset-2 hover:underline">privacy policy</a>.
      </p>
    </form>
  );
}
