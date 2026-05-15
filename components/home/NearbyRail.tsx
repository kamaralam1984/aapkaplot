"use client";

import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { Property } from "@/lib/types";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Container } from "@/components/layout/Container";

interface NearbyRailProps {
  properties: Property[];
  title?: string;
  subtitle?: string;
}

export function NearbyRail({
  properties,
  title = "Nearby Properties",
  subtitle = "Live results based on your location",
}: NearbyRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className="relative -mt-2">
      <Container size="wide">
        {(title || subtitle) && (
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-display-md font-display text-ink-900">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[13.5px] text-ink-500">{subtitle}</p>
              )}
            </div>
            <div className="hidden gap-2 md:flex">
              <RailNav onClick={() => scrollBy(-1)} aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </RailNav>
              <RailNav onClick={() => scrollBy(1)} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </RailNav>
            </div>
          </div>
        )}

        <div className="relative">
          <div
            ref={railRef}
            className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
          >
            {properties.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className="snap-start"
              >
                <PropertyCard property={p} variant="compact" />
              </motion.div>
            ))}
          </div>
          {/* Edge fade */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
        </div>
      </Container>
    </section>
  );
}

function RailNav({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="grid h-10 w-10 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900"
    >
      {children}
    </button>
  );
}
