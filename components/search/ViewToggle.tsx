"use client";

import { LayoutGrid, Map as MapIcon, Columns2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/lib/search-params";
import { useFilterPatch } from "./useFilterPatch";

const OPTIONS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "list",  label: "List",  icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: "split", label: "Split", icon: <Columns2 className="h-3.5 w-3.5" /> },
  { id: "map",   label: "Map",   icon: <MapIcon className="h-3.5 w-3.5" /> },
];

export function ViewToggle({ value }: { value: ViewMode }) {
  const patch = useFilterPatch();
  return (
    <div className="inline-flex h-10 rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
      {OPTIONS.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => patch({ view: o.id === "split" ? null : o.id })}
            aria-pressed={active}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition",
              active ? "text-white" : "text-ink-700 hover:bg-ink-100/60"
            )}
          >
            {active && (
              <motion.span
                layoutId="view-active"
                className="absolute inset-0 rounded-lg bg-ink-900 shadow-soft"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon}
              <span className="hidden sm:inline">{o.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
