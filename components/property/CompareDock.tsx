"use client";

import Link from "next/link";
import Image from "next/image";
import { X, GitCompare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompare } from "@/lib/use-compare";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Floating bottom-right dock showing properties picked for comparison.
 * Lives in app/layout.tsx so it's visible on every page.
 *
 * Looks up details from the mock catalogue first (works offline / SSR).
 * Once the public property API is wired this can fetch live cards.
 */
export function CompareDock() {
  const { ids, remove, clear } = useCompare();
  if (ids.length === 0) return null;

  const items = ids
    .map((id) => MOCK_PROPERTIES.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <AnimatePresence>
      <motion.div
        key="dock"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 lg:bottom-5"
      >
        <div className="pointer-events-auto surface-card flex max-w-3xl items-center gap-2 rounded-2xl border border-ink-200/70 bg-white/95 p-2 shadow-card backdrop-blur-xl">
          <span className="ml-1 hidden text-[11.5px] font-semibold uppercase tracking-wider text-ink-500 sm:inline">
            Compare
          </span>
          <ul className="flex items-center gap-2">
            {items.map((p) => (
              <li key={p.id} className="relative">
                <Link
                  href={`/property/${p.id}`}
                  className="relative block h-12 w-16 overflow-hidden rounded-lg bg-ink-100"
                >
                  <Image src={p.media.cover} alt={p.title} fill sizes="64px" className="object-cover" />
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  aria-label={`Remove ${p.title}`}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink-900 text-white shadow-soft hover:bg-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
            {Array.from({ length: 3 - items.length }).map((_, i) => (
              <li
                key={`ghost-${i}`}
                className="h-12 w-16 rounded-lg border border-dashed border-ink-200 bg-ink-50/40"
              />
            ))}
          </ul>
          <Link
            href={`/compare?ids=${items.map((p) => p.id).join(",")}`}
            className={cn(
              "ml-1 inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-[13px] font-bold text-white shadow-glow",
              items.length < 2 && "pointer-events-none opacity-50"
            )}
          >
            <GitCompare className="h-4 w-4" />
            Compare {items.length >= 2 ? `(${items.length})` : ""}
          </Link>
          <button
            onClick={clear}
            className="rounded-lg px-2 py-1 text-[11.5px] font-semibold text-ink-500 hover:bg-ink-100"
          >
            Clear
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
