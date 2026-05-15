"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Paperclip, Phone, Send, Video, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Conversation, Message } from "@/lib/mock-dashboard";
import { cn } from "@/lib/utils";
import { getPropertyById } from "@/lib/mock-dashboard";

const SPAM_PATTERNS: RegExp[] = [
  /\b(?:loan|crypto|forex|bitcoin|lottery|jackpot)\b/i,
  /https?:\/\/(?!aapkaplot\.com)/i,
  /(.)\1{4,}/,                       // 5+ repeated chars
  /\b\d[\d\s\-]{8,}\d\b/,             // phone numbers leaked in chat
];
const RATE_LIMIT = { max: 5, windowMs: 15_000 };

interface ChatThreadProps {
  conversation: Conversation;
  initialMessages: Message[];
}

export function ChatThread({ conversation, initialMessages }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const sendTimestampsRef = useRef<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const property = conversation.propertyId ? getPropertyById(conversation.propertyId) : null;

  const detectSpam = (text: string): string | null => {
    for (const re of SPAM_PATTERNS) {
      if (re.test(text)) {
        return "Message blocked — looks like spam, a phone number or external link. Please share details in the visit form instead.";
      }
    }
    return null;
  };

  const passesRateLimit = (): boolean => {
    const now = Date.now();
    sendTimestampsRef.current = sendTimestampsRef.current.filter(
      (t) => now - t < RATE_LIMIT.windowMs
    );
    if (sendTimestampsRef.current.length >= RATE_LIMIT.max) {
      setWarning(`Too many messages — please wait a few seconds.`);
      return false;
    }
    sendTimestampsRef.current.push(now);
    return true;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const spamWarn = detectSpam(draft);
    if (spamWarn) {
      setWarning(spamWarn);
      return;
    }
    if (!passesRateLimit()) return;
    setWarning(null);
    const me: Message = {
      id: `m-${Date.now()}`,
      conversationId: conversation.id,
      fromMe: true,
      text: draft.trim(),
      at: new Date().toISOString(),
    };
    setMessages((m) => [...m, me]);
    setDraft("");

    // Simulate counterpart typing + reply
    setTimeout(() => setTyping(true), 400);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: `m-${Date.now() + 1}`,
          conversationId: conversation.id,
          fromMe: false,
          text: "Got it — I'll come back to you shortly with details.",
          at: new Date().toISOString(),
        },
      ]);
    }, 2200);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-ink-200/70 bg-white/95 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/chat"
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-100 lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-ink-100">
          {conversation.withAvatar ? (
            <Image src={conversation.withAvatar} alt={conversation.withName} fill sizes="40px" className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-brand-gradient text-[13px] font-bold text-white">
              {conversation.withName.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1 truncate text-[14px] font-bold text-ink-900">
            {conversation.withName}
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
          </p>
          <p className="truncate text-[11.5px] text-ink-500 capitalize">
            {conversation.withRole === "support" ? "AapKaPlot Support" : conversation.withRole}
            {property && (
              <> · <Link href={`/property/${property.id}`} className="hover:text-ink-800 hover:underline">{property.title}</Link></>
            )}
          </p>
        </div>
        <div className="flex gap-1">
          <IconBtn label="Voice call"><Phone className="h-4 w-4" /></IconBtn>
          <IconBtn label="Video call"><Video className="h-4 w-4" /></IconBtn>
        </div>
      </header>

      {/* Property context strip */}
      {property && (
        <Link
          href={`/property/${property.id}`}
          className="flex items-center gap-3 border-b border-ink-200/70 bg-white px-4 py-2.5 hover:bg-ink-50"
        >
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
            <Image src={property.media.cover} alt={property.title} fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-ink-900">{property.title}</p>
            <p className="truncate text-[11.5px] text-ink-500">
              {property.location.locality}, {property.location.city}
            </p>
          </div>
          <span className="text-[12.5px] font-bold text-emerald-600">
            ₹{(property.priceInr / 1_00_000).toFixed(2)} L
          </span>
        </Link>
      )}

      {/* Messages */}
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
                <p>{m.text}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    m.fromMe ? "text-white/70" : "text-ink-400"
                  )}
                >
                  {new Date(m.at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-soft">
                <Dot delay={0} />
                <Dot delay={0.15} />
                <Dot delay={0.3} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Warning */}
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

      {/* Composer */}
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
          disabled={!draft.trim()}
          className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function IconBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-ink-100"
    >
      {children}
    </button>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="h-1.5 w-1.5 rounded-full bg-ink-400"
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 0.7, delay }}
    />
  );
}
