"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, IndianRupee, HelpCircle, Building2, Newspaper, Briefcase, Cpu, Megaphone, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/pricing",        label: "Pricing",        icon: <IndianRupee className="h-4 w-4" /> },
  { href: "/sell/new",       label: "Post property",  icon: <Building2 className="h-4 w-4" /> },
  { href: "/sell/boost",     label: "Boost a listing", icon: <Megaphone className="h-4 w-4" /> },
  { href: "/referrals",      label: "Refer & earn",   icon: <Briefcase className="h-4 w-4" /> },
  { href: "/help",           label: "Help Center",    icon: <HelpCircle className="h-4 w-4" /> },
  { href: "/about",          label: "About AapKaPlot",icon: <Building2 className="h-4 w-4" /> },
  { href: "/ai-technology",  label: "AI & Technology",icon: <Cpu className="h-4 w-4" /> },
  { href: "/blog",           label: "Blog",           icon: <BookOpen className="h-4 w-4" /> },
  { href: "/press",          label: "Press",          icon: <Newspaper className="h-4 w-4" /> },
  { href: "/careers",        label: "Careers",        icon: <Briefcase className="h-4 w-4" /> },
];

interface MoreMenuProps {
  label: string;
}

export function MoreMenu({ label }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium text-ink-700 transition hover:bg-ink-100/70 hover:text-ink-900"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            role="menu"
            className="absolute left-1/2 top-full z-50 mt-1 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-ink-200 bg-white p-2 shadow-lift"
          >
            <ul className="grid grid-cols-1 gap-0.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium text-ink-700 transition hover:bg-ink-100/60 hover:text-ink-900"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      {l.icon}
                    </span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
