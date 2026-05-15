"use client";

import { useRef } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { Property } from "@/lib/types";

interface AIRecommendationsProps {
  properties: Property[];
}

export function AIRecommendations({ properties }: AIRecommendationsProps) {
  const railRef = useRef<HTMLDivElement>(null);

  return (
    <section className="mt-12 lg:mt-16">
      <Container size="wide">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Recommendations rail */}
          <div className="surface-card p-4 lg:p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recommended for You
                </div>
                <p className="mt-1 text-[13.5px] text-ink-500">
                  Smart picks based on your location &amp; preferences
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  railRef.current?.scrollBy({
                    left: railRef.current.clientWidth * 0.85,
                    behavior: "smooth",
                  })
                }
                aria-label="Next"
                className="hidden h-10 w-10 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900 md:grid"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <div
                ref={railRef}
                className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1"
              >
                {properties.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="snap-start"
                  >
                    <PropertyCard property={p} showAIBadge variant="compact" />
                  </motion.div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
            </div>
          </div>

          {/* WhyUs side panel */}
          <WhyAapKaPlot />
        </div>
      </Container>
    </section>
  );
}

import { Sparkles as SparklesIcon, Satellite, ShieldCheck, MapPin } from "lucide-react";

const WHY_LIST = [
  { id: "ai", icon: <SparklesIcon className="h-5 w-5" />, tone: "bg-emerald-50 text-emerald-600", title: "AI Powered Search", body: "Get best results with AI" },
  { id: "satellite", icon: <Satellite className="h-5 w-5" />, tone: "bg-sky-50 text-sky-600", title: "Live Satellite View", body: "See real view of property" },
  { id: "verified", icon: <ShieldCheck className="h-5 w-5" />, tone: "bg-emerald-50 text-emerald-600", title: "Verified Properties", body: "100% verified & trusted" },
  { id: "nearby", icon: <MapPin className="h-5 w-5" />, tone: "bg-rose-50 text-rose-600", title: "Nearby Properties", body: "Find near you instantly" },
];

function WhyAapKaPlot() {
  return (
    <aside className="surface-card p-5">
      <h3 className="text-[15px] font-bold text-ink-900">Why AapKaPlot?</h3>
      <ul className="mt-4 space-y-4">
        {WHY_LIST.map((w, i) => (
          <motion.li
            key={w.id}
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="flex items-start gap-3"
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${w.tone}`}>
              {w.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold leading-tight text-ink-900">
                {w.title}
              </p>
              <p className="text-[12.5px] text-ink-500">{w.body}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </aside>
  );
}
