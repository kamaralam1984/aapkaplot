"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

export function FilterSection({
  title,
  defaultOpen = true,
  count,
  children,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-ink-200/70 px-4 py-3.5 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-ink-900">
          {title}
          {count != null && count > 0 && (
            <span className="rounded-full bg-brand-50 px-1.5 text-[11px] font-bold text-brand-700">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-ink-400 transition", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
