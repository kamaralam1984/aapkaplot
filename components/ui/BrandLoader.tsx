"use client";

import { motion } from "framer-motion";

/**
 * Full-page branded loader. Used as the default content for route-level
 * loading.tsx files. Looks like a "VFX" splash: animated rings around a
 * gradient brand badge, with a shimmering tagline and a tiny bar.
 */
export function BrandLoader({ label = "Loading AapKaPlot…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative h-28 w-28">
          {/* Outer pulse ring */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-brand-gradient opacity-30 blur-xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Rotating ring */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "rgb(99,102,241)",
              borderRightColor: "rgb(16,185,129)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          {/* Counter-rotating inner ring */}
          <motion.span
            aria-hidden
            className="absolute inset-3 rounded-full border-2 border-transparent"
            style={{
              borderBottomColor: "rgb(244,114,182)",
              borderLeftColor: "rgb(245,158,11)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          {/* Brand badge */}
          <motion.div
            className="absolute inset-0 m-auto grid h-14 w-14 place-items-center self-center rounded-2xl bg-brand-gradient text-white shadow-glow"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-lg font-display font-bold">A</span>
          </motion.div>
        </div>

        <motion.p
          className="mt-6 text-[13.5px] font-semibold tracking-wide text-ink-700"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.p>

        <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-ink-100">
          <motion.span
            className="block h-full w-1/3 rounded-full bg-brand-gradient"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
