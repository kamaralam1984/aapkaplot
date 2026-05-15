"use client";

import { motion } from "framer-motion";
import type { Property } from "@/lib/types";
import { PropertyCard } from "@/components/property/PropertyCard";
import { cn } from "@/lib/utils";

interface ResultsGridProps {
  items: (Property & { distanceKm: number })[];
  variant: "wide" | "split";
  highlightId?: string | null;
  onHover?: (id: string | null) => void;
}

export function ResultsGrid({ items, variant, highlightId, onHover }: ResultsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        variant === "wide"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2"
      )}
    >
      {items.map((p, i) => (
        <motion.div
          key={p.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
          onMouseEnter={() => onHover?.(p.id)}
          onMouseLeave={() => onHover?.(null)}
          className={cn(
            "transition-all duration-200",
            highlightId === p.id && "ring-2 ring-brand-500/40 rounded-2xl"
          )}
        >
          <PropertyCard property={p} />
        </motion.div>
      ))}
    </div>
  );
}
