/**
 * AI Chat Assistant feature showcase — sits below the hero/featured grid.
 * Displays a faux chat panel with animated typing + 4 feature pills so
 * visitors understand what the floating bot can actually do.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SCRIPT: { role: "bot" | "user"; text: string }[] = [
  { role: "bot",  text: "Hi 👋 What kind of property are you looking for?" },
  { role: "user", text: "2 BHK flat in Boring Road, under ₹60 L" },
  { role: "bot",  text: "Got 12 verified flats in that range. Want me to schedule a site visit for top 3?" },
  { role: "user", text: "Yes, weekend works" },
  { role: "bot",  text: "Done. WhatsApp confirmation incoming in 2 mins ✅" },
];

const FEATURES = [
  { icon: "💰", title: "Ask your budget", text: "Bot understands lakh/crore in Hindi & English." },
  { icon: "🏘", title: "Suggest property", text: "Filters by location, BHK, price, and amenities." },
  { icon: "📅", title: "Schedule visit",  text: "Confirms a time slot with the seller automatically." },
  { icon: "💬", title: "WhatsApp follow-up", text: "Continues the chat on WhatsApp after first contact." },
];

export function AiAssistantShowcase() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= SCRIPT.length) {
      const restart = setTimeout(() => setStep(0), 4000);
      return () => clearTimeout(restart);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 1500);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-emerald-50/40 to-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">24×7 AI assistant</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-semibold text-ink-900">
              Property hunt without the back-and-forth
            </h2>
            <p className="mt-3 text-ink-700 leading-relaxed max-w-xl">
              Tell our AI what you want — in Hindi, English or Hinglish — and it shortlists verified plots, flats and houses in seconds. When you are ready, it hands the conversation off to WhatsApp so a human picks up.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-2xl">{f.icon}</p>
                  <p className="mt-1 font-semibold text-ink-900">{f.title}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{f.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/search" className="inline-flex rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105">
                Browse Verified Listings
              </Link>
              <Link href="https://wa.me/917039125391" className="inline-flex rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
                WhatsApp Us
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-white ring-1 ring-ink-200/70 shadow-lift p-4 sm:p-5">
              <div className="flex items-center gap-2 border-b border-ink-200/70 pb-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-white text-xs font-bold">AI</span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">AapKaPlot AI</p>
                  <p className="text-[11px] text-emerald-700">● Online · replies in seconds</p>
                </div>
              </div>
              <div className="mt-3 space-y-2 min-h-[260px]">
                {SCRIPT.slice(0, step).map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-ink-50 text-ink-800 rounded-bl-sm"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {step < SCRIPT.length && (
                  <div className={`flex ${SCRIPT[step].role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${SCRIPT[step].role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-ink-50 text-ink-800 rounded-bl-sm"} inline-flex items-center gap-1`}>
                      <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* glow */}
            <div aria-hidden className="absolute -inset-4 rounded-3xl bg-emerald-300/20 blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Dot({ delay }: { delay: number }) {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: `${delay}ms` }} />;
}
