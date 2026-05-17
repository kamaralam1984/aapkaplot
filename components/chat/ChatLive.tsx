"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, Send, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LiveMessage {
  id: string;
  fromUserId: string;
  body: string;
  createdAt: string;
  fromMe: boolean;
}

interface ChatLiveProps {
  leadId: string;
  meId: string;
  withName?: string;
  propertyTitle?: string;
}

export function ChatLive({ leadId, meId, withName, propertyTitle }: ChatLiveProps) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/chat/${leadId}/messages`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list: LiveMessage[] = (data.messages ?? []).map((m: LiveMessage) => ({
          ...m,
          fromMe: m.fromUserId === meId,
        }));
        list.forEach((m) => seenIds.current.add(m.id));
        setMessages(list);
      } catch {
        // Silent — SSE will keep trying.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, meId]);

  // SSE subscription.
  useEffect(() => {
    const es = new EventSource(`/api/chat/${leadId}/stream`);
    es.addEventListener("ready", () => setConnected(true));
    es.addEventListener("message", (ev: MessageEvent) => {
      try {
        const m = JSON.parse(ev.data) as LiveMessage;
        if (seenIds.current.has(m.id)) return;
        seenIds.current.add(m.id);
        setMessages((prev) => [...prev, { ...m, fromMe: m.fromUserId === meId }]);
      } catch {
        // ignore malformed event
      }
    });
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [leadId, meId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setWarning(null);
    try {
      const res = await fetch(`/api/chat/${leadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.error === "spam_blocked") {
        setWarning("Message blocked — looks like spam, a phone number or external link.");
        return;
      }
      if (!res.ok) {
        setWarning(data.error ?? "Couldn't send. Try again.");
        return;
      }
      const m: LiveMessage = data.message;
      if (m && !seenIds.current.has(m.id)) {
        seenIds.current.add(m.id);
        setMessages((prev) => [...prev, m]);
      }
      setDraft("");
    } catch {
      setWarning("Network error.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-ink-200/70 bg-white/95 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/chat"
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-100 lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-[13px] font-bold text-white">
          {(withName ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink-900">{withName ?? "Conversation"}</p>
          <p className="truncate text-[11.5px] text-ink-500">
            {propertyTitle ? `About: ${propertyTitle} · ` : ""}
            <span className={cn(connected ? "text-emerald-600" : "text-ink-400")}>
              {connected ? "● live" : "○ reconnecting"}
            </span>
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_center,#ecfdf5_0%,#f8fafc_70%)] px-4 py-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
              className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug shadow-soft",
                  m.fromMe
                    ? "rounded-br-md bg-brand-gradient text-white"
                    : "rounded-bl-md bg-white text-ink-900"
                )}
              >
                <p>{m.body}</p>
                <p className={cn("mt-1 text-[10px]", m.fromMe ? "text-white/70" : "text-ink-400")}>
                  {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="border-t border-amber-200/70 bg-amber-50 px-4 py-2 text-[12px] text-amber-800"
          >
            <span className="inline-flex items-start gap-1.5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {warning}
              <button
                type="button"
                onClick={() => setWarning(null)}
                className="ml-auto font-semibold underline-offset-2 hover:underline"
              >
                Dismiss
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-ink-200/70 bg-white px-3 py-2.5"
      >
        <button
          type="button"
          aria-label="Attach"
          className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 hover:bg-ink-100"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-3.5 text-[14px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim() || sending}
          className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
