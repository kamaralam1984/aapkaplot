"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Crosshair } from "lucide-react";

const STORAGE_KEY = "akp.gps.banner.v1";

interface GpsConsentBannerProps {
  onAllow: () => void;
}

export function GpsConsentBanner({ onAllow }: GpsConsentBannerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show only once per browser; respect existing geo permission.
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;
    if (!("geolocation" in navigator)) return;

    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (allow: boolean) => {
    localStorage.setItem(STORAGE_KEY, allow ? "allowed" : "dismissed");
    setOpen(false);
    if (allow) onAllow();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed bottom-4 left-1/2 z-50 w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-ink-200 bg-white p-3 shadow-lift backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-ink-900">
                Show properties near you?
              </p>
              <p className="text-[12px] text-ink-500">
                We'll use your device location only to rank listings by distance.
                Never shared with sellers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(false)}
              aria-label="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => dismiss(false)}
              className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] font-semibold text-ink-700 hover:border-brand-500/40"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-2 text-[13px] font-semibold text-white shadow-glow"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Use my location
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
