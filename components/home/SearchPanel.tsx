"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Crosshair, ChevronDown, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { serializeFilters } from "@/lib/search-params";
import type { ListingIntent, PropertyKind } from "@/lib/types";

const INTENT_TABS: {
  id: string;
  label: string;
  intent?: ListingIntent;
  kind?: PropertyKind;
}[] = [
  { id: "buy",        label: "Buy",        intent: "buy" },
  { id: "rent",       label: "Rent",       intent: "rent" },
  { id: "plot",       label: "Plots",      kind: "plot" },
  { id: "flat",       label: "Flats",      kind: "flat" },
  { id: "house",      label: "Houses",     kind: "house" },
  { id: "commercial", label: "Commercial", kind: "shop" },
];

const FILTER_CHIPS = [
  { id: "budget", label: "Budget" },
  { id: "type", label: "Property Type" },
  { id: "bhk", label: "BHK" },
];

interface SearchPanelProps {
  onLocate?: () => void;
  isLocating?: boolean;
}

export function SearchPanel({ onLocate, isLocating }: SearchPanelProps) {
  const [tab, setTab] = useState("buy");
  const [query, setQuery] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = INTENT_TABS.find((it) => it.id === tab);
    const params = serializeFilters({
      q: query || undefined,
      intent: t?.intent,
      kind: t?.kind,
      sort: "newest",
      view: "split",
      page: 1,
      amenities: [],
    });
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-3 sm:p-4"
    >
      {/* Intent tabs */}
      <div
        role="tablist"
        className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-3"
      >
        {INTENT_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors",
                active ? "text-white" : "text-ink-700 hover:bg-ink-100"
              )}
            >
              {active && (
                <motion.span
                  layoutId="search-tab-active"
                  className="absolute inset-0 rounded-full bg-brand-gradient shadow-glow"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search row */}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative flex h-12 items-center rounded-xl border border-ink-200 bg-white px-3 shadow-soft transition focus-within:border-brand-500 focus-within:shadow-ring">
          <Search className="h-[18px] w-[18px] text-ink-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location or property..."
            className="ml-2 w-full bg-transparent text-[14px] placeholder:text-ink-400 focus:outline-none"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onLocate}
          iconLeft={<Crosshair className={cn("h-[18px] w-[18px]", isLocating && "animate-spin")} />}
          className="h-12 px-4"
        >
          {isLocating ? "Locating..." : "Use My Location"}
        </Button>
        <Button type="submit" variant="primary" size="lg" iconLeft={<Search className="h-[18px] w-[18px]" />} className="h-12 px-5">
          Search
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {FILTER_CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-medium text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900"
          >
            {c.label}
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-medium text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900"
        >
          More Filters
          <SlidersHorizontal className="h-4 w-4 text-ink-400" />
        </button>
      </div>
    </motion.form>
  );
}
