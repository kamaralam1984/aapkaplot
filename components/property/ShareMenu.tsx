"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link2, Check, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface ShareMenuProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
}

export function ShareMenu({ title, text = "", url, className }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fullUrl = url.startsWith("http") ? url : typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  const message = encodeURIComponent(`${title}${text ? ` — ${text}` : ""}`);
  const enc = encodeURIComponent(fullUrl);

  const openShare = async () => {
    // Prefer the native sheet on mobile.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title,
          text,
          url: fullUrl,
        });
        return;
      } catch {
        /* fall through to popover */
      }
    }
    setOpen(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.show({ kind: "success", title: "Link copied", description: fullUrl, duration: 2400 });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", fullUrl);
    }
  };

  const channels = [
    { id: "wa",   label: "WhatsApp", href: `https://wa.me/?text=${message}%20${enc}`, color: "bg-emerald-500", icon: <WhatsApp /> },
    { id: "tg",   label: "Telegram", href: `https://t.me/share/url?url=${enc}&text=${message}`, color: "bg-sky-500", icon: <Telegram /> },
    { id: "fb",   label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, color: "bg-[#1877F2]", icon: <Facebook /> },
    { id: "x",    label: "X / Twitter", href: `https://twitter.com/intent/tweet?url=${enc}&text=${message}`, color: "bg-ink-900", icon: <XLogo /> },
    { id: "mail", label: "Email",    href: `mailto:?subject=${encodeURIComponent(title)}&body=${message}%20${enc}`, color: "bg-rose-500", icon: <Mail className="h-4 w-4" /> },
  ];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={openShare}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-[13px] font-semibold text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift"
          >
            <header className="flex items-center justify-between border-b border-ink-200/70 px-4 py-2.5">
              <p className="text-[12.5px] font-bold text-ink-900">Share property</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <ul className="grid grid-cols-5 gap-1 p-3">
              {channels.map((c) => (
                <li key={c.id}>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <span className={cn("grid h-10 w-10 place-items-center rounded-full text-white shadow-soft transition group-hover:scale-105", c.color)}>
                      {c.icon}
                    </span>
                    <span className="text-[10.5px] font-medium text-ink-600">{c.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink-200/70 p-3">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-2.5">
                <Link2 className="h-3.5 w-3.5 text-ink-500" />
                <span className="flex-1 truncate text-[12px] text-ink-700">{fullUrl}</span>
                <button
                  type="button"
                  onClick={copy}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] font-bold transition",
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-ink-900 text-white hover:bg-ink-800"
                  )}
                >
                  {copied ? <><Check className="h-3 w-3" /> Copied</> : "Copy"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Brand SVGs */
function WhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.9-1.5a11 11 0 0 0 5.1 1.3 11 11 0 0 0 8.5-18.3zM12 19.9c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-2.9.9.9-2.8-.2-.3a9 9 0 1 1 15.3-6.4 9 9 0 0 1-8.4 10zm5-6.8c-.3-.1-1.7-.8-2-.9s-.5-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1c-1.7-.8-2.8-1.5-4-3.3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5L9 6c-.1-.2-.3-.2-.5-.2h-.4c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.1 2.9c.1.2 2 3.1 4.8 4.4 1.7.7 2.4.8 3.2.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
    </svg>
  );
}
function Telegram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M9.04 15.45 8.9 19.7c.45 0 .65-.2.88-.43l2.13-2.03 4.42 3.24c.81.45 1.4.21 1.61-.75l2.92-13.67c.27-1.2-.43-1.66-1.22-1.37L3.36 9.96c-1.18.46-1.16 1.12-.2 1.42l4.16 1.3 9.68-6.1c.46-.3.87-.13.53.16z" />
    </svg>
  );
}
function Facebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M22 12.07C22 6.49 17.52 2 12 2S2 6.49 2 12.07c0 4.96 3.66 9.07 8.44 9.86V14.9H7.9v-2.83h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.83h-2.33V22c4.78-.8 8.44-4.9 8.44-9.93z" />
    </svg>
  );
}
function XLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
