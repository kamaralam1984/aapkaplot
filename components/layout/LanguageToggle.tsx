"use client";

import { useEffect, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { id: "en", label: "English",  native: "English" },
  { id: "hi", label: "Hindi",    native: "हिंदी" },
  { id: "bn", label: "Bengali",  native: "বাংলা" },
  { id: "ta", label: "Tamil",    native: "தமிழ்" },
  { id: "te", label: "Telugu",   native: "తెలుగు" },
  { id: "mr", label: "Marathi",  native: "मराठी" },
] as const;

type LangId = (typeof LANGUAGES)[number]["id"];

const STORAGE_KEY = "akp.lang.v1";

export function LanguageToggle({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<LangId>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LangId | null;
    if (saved) {
      setLang(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const pick = (id: LangId) => {
    setLang(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.lang = id;
    setOpen(false);
    // Broadcast so other components can react.
    window.dispatchEvent(new CustomEvent("akp:lang-change", { detail: id }));
  };

  const current = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-700 shadow-soft transition hover:border-brand-500/40"
      >
        <Globe className="h-4 w-4 text-brand-500" />
        <span className="hidden sm:inline">{current.native}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-ink-400 transition", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1 shadow-lift"
          >
            <p className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              Choose language
            </p>
            {LANGUAGES.map((l) => {
              const active = l.id === lang;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(l.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
                      active ? "bg-brand-50 text-brand-700" : "hover:bg-ink-100/60"
                    )}
                  >
                    <span>
                      <span className="block text-[13px] font-semibold text-ink-900">{l.native}</span>
                      <span className="block text-[11px] text-ink-500">{l.label}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-brand-600" />}
                  </button>
                </li>
              );
            })}
            <p className="border-t border-ink-200/70 px-3 py-2 text-[10.5px] text-ink-500">
              Full UI translation coming soon — your preference is saved.
            </p>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
