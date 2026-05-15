"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SortKey } from "@/lib/search-params";
import { useFilterPatch } from "./useFilterPatch";

const OPTIONS: { id: SortKey; label: string; hint: string }[] = [
  { id: "newest",     label: "Newest first",      hint: "Most recently listed" },
  { id: "price-asc",  label: "Price: Low to High", hint: "Cheapest first" },
  { id: "price-desc", label: "Price: High to Low", hint: "Premium first" },
  { id: "distance",   label: "Distance",          hint: "Closest to you" },
  { id: "trust",      label: "Trust Score",       hint: "Most trusted first" },
];

export function SortMenu({ value }: { value: SortKey }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const patch = useFilterPatch();

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

  const current = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 text-[13px] font-semibold text-ink-800 shadow-soft transition hover:border-brand-500/40"
      >
        <ArrowUpDown className="h-4 w-4 text-ink-500" />
        <span className="hidden sm:inline">Sort:</span> {current.label}
        <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1 shadow-lift"
          >
            {OPTIONS.map((o) => {
              const active = o.id === value;
              return (
                <li key={o.id}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      patch({ sort: o.id === "newest" ? null : o.id });
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition",
                      active ? "bg-brand-50" : "hover:bg-ink-100/60"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                        active ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300"
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink-900">{o.label}</span>
                      <span className="block text-[11.5px] text-ink-500">{o.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
