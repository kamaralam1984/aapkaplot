/**
 * Floating AI chatbot widget — bottom-left, opens a small chat panel.
 * Uses /api/ai/chat (existing route) when available; falls back to a
 * canned-response flow if the API key is missing or rate-limited.
 *
 * Per [[free-apis-only]] memory: no paid services. The fallback flow
 * is good enough to capture intent and prompt the user to WhatsApp.
 */
"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage { role: "user" | "bot"; text: string }

const PHONE = "917039125391";

const SUGGESTED_QUERIES = [
  "Plots in Patna under ₹20 lakh",
  "2 BHK flats for rent in Boring Road",
  "Best investment locality in Bihar",
  "Schedule a site visit",
];

export function FloatingChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Namaste 🌸 main Chinkki — AapKaPlot ki AI saheli. Plot lena, rent karna, ya bas dhoondhna chahte hain? Apna budget aur sheher batayein, main aapke liye behtareen verified options chunti hoon — saath mein nearest amenities aur future growth bhi batati hoon." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function pushBot(text: string) {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text }]);
      setTyping(false);
    }, 700 + Math.random() * 600);
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    // Try the AI chat API (OpenAI-backed). Send full message history so the
    // assistant has context across turns.
    try {
      const history = [...messages, { role: "user" as const, text }];
      const apiMessages = history.map((m) => ({
        role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        const reply = (j.reply ?? j.message ?? j.text ?? "").toString().trim();
        if (reply) { pushBot(reply); return; }
      }
    } catch { /* fall through */ }

    // Canned fallback — keeps the conversation moving toward WhatsApp.
    const lower = text.toLowerCase();
    if (lower.includes("budget") || lower.match(/\d+\s*(lakh|cr|crore)/)) {
      pushBot("Bahut khoob ji 🌸 main aapke budget mein verified listings shortlist kar dungi. Sheher ya locality batayein — saath mein wahaan ki nearest school, hospital aur upcoming development bhi batati chalungi. WhatsApp par bhi sab bhej sakti hoon.");
    } else if (lower.includes("visit") || lower.includes("schedule")) {
      pushBot("Site-visit ki khaas baat aap kahi 😊 — apna phone number ya WhatsApp par tap kijiye, AapKaPlot ka local expert 30 min mein time confirm kar dega. Maine note kar liya hai ji.");
    } else if (lower.includes("patna") || lower.includes("bihar") || lower.includes("plot")) {
      pushBot("Patna aur Bihar mein fresh verified plots aur flats hain — Boring Road, Kankarbagh, Bailey Road sab covered. Aap budget aur locality batayein, main sirf wahi properties chunungi jismein paani-bijli-sadak achi ho aur future mein appreciation acha ho.");
    } else {
      pushBot("Theek hai ji 🌸 — neeche WhatsApp button par tap karein hamari team se jaldi baat ho jayegi, ya mujhe apna sheher aur budget batayein, main khaas options dikhati hoon.");
    }
  }

  if (!open) {
    return (
      <button
        aria-label="Chinkki se baat karein — AapKaPlot AI saheli"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[60] inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-white shadow-glow hover:brightness-105 active:scale-95 transition"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-pink-600 text-xs font-bold">Ch</span>
        <span className="hidden sm:inline text-sm font-semibold">Chinkki se poochiye</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-[60] w-[min(360px,calc(100vw-2.5rem))] rounded-2xl bg-white shadow-lift ring-1 ring-ink-200/70 overflow-hidden flex flex-col max-h-[min(560px,calc(100vh-2.5rem))]">
      <header className="flex items-center justify-between bg-brand-gradient px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-pink-600 text-xs font-bold">Ch</span>
          <div>
            <p className="text-sm font-semibold leading-none">Chinkki · AapKaPlot</p>
            <p className="text-[11px] opacity-90 mt-0.5">Online · narmi se jawab deti hoon</p>
          </div>
        </div>
        <button aria-label="Close chat" onClick={() => setOpen(false)} className="text-white/85 hover:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-ink-50/40">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white text-ink-800 ring-1 ring-ink-200/70 rounded-bl-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white text-ink-700 ring-1 ring-ink-200/70 rounded-2xl rounded-bl-sm px-3 py-2 text-sm inline-flex items-center gap-1">
              <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_QUERIES.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2.5 py-1 hover:bg-emerald-100">{s}</button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-ink-200/70 p-2 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="flex-1 rounded-full bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
        <button type="submit" disabled={!input.trim()} className="rounded-full bg-emerald-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50">Send</button>
      </form>
      <a
        href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi AapKaPlot, I started a chat on the website — can we continue here?")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#25D366] text-white text-center text-xs font-semibold py-2 hover:brightness-110"
      >
        Continue on WhatsApp →
      </a>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="block h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
