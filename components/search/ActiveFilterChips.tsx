"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedSearchFilters } from "@/lib/search-params";
import { useFilterPatch } from "./useFilterPatch";
import { formatInr } from "@/lib/format";
import { AMENITIES_CATALOG } from "@/lib/property-detail";

const KIND_LABEL: Record<string, string> = {
  plot: "Plot",
  flat: "Flat",
  house: "House",
  villa: "Villa",
  shop: "Shop",
  office: "Office",
  warehouse: "Warehouse",
  agriculture: "Agriculture",
};

const INTENT_LABEL: Record<string, string> = {
  buy: "For Buy",
  rent: "For Rent",
  sell: "For Sell",
};

interface ActiveFilterChipsProps {
  filters: ParsedSearchFilters;
}

export function ActiveFilterChips({ filters }: ActiveFilterChipsProps) {
  const patch = useFilterPatch();
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.q) {
    chips.push({ key: "q", label: `"${filters.q}"`, clear: () => patch({ q: null }) });
  }
  if (filters.intent) {
    chips.push({ key: "intent", label: INTENT_LABEL[filters.intent], clear: () => patch({ intent: null }) });
  }
  if (filters.kind) {
    chips.push({ key: "kind", label: KIND_LABEL[filters.kind], clear: () => patch({ kind: null }) });
  }
  if (filters.bhk != null) {
    chips.push({ key: "bhk", label: `${filters.bhk} BHK`, clear: () => patch({ bhk: null }) });
  }
  if (filters.budgetMin != null || filters.budgetMax != null) {
    const min = filters.budgetMin != null ? formatInr(filters.budgetMin) : "Any";
    const max = filters.budgetMax != null ? formatInr(filters.budgetMax) : "Any";
    chips.push({
      key: "budget",
      label: `${min} – ${max}`,
      clear: () => patch({ budgetMin: null, budgetMax: null }),
    });
  }
  if (filters.verifiedOnly) {
    chips.push({ key: "verifiedOnly", label: "Verified only", clear: () => patch({ verifiedOnly: null }) });
  }
  if (filters.radiusKm != null) {
    chips.push({
      key: "radius",
      label: `Within ${filters.radiusKm < 1 ? `${Math.round(filters.radiusKm * 1000)} m` : `${filters.radiusKm} km`}`,
      clear: () => patch({ radiusKm: null }),
    });
  }
  for (const a of filters.amenities) {
    chips.push({
      key: `a-${a}`,
      label: AMENITIES_CATALOG[a]?.label ?? a,
      clear: () => patch({ amenities: filters.amenities.filter((x) => x !== a) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <AnimatePresence initial={false}>
        {chips.map((c) => (
          <motion.button
            key={c.key}
            layout
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            onClick={c.clear}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            {c.label}
            <X className="h-3 w-3" />
          </motion.button>
        ))}
      </AnimatePresence>
      <Link
        href="/search"
        className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-ink-500 transition hover:text-ink-800 underline-offset-2 hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
