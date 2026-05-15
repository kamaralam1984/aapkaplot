"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, BadgeCheck, MapPin, Bed, Maximize2, ArrowUpRight, ShieldCheck } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatInr, formatArea } from "@/lib/format";
import { formatDistance } from "@/lib/haversine";

interface QuickPreviewProps {
  property: (Property & { distanceKm?: number }) | null;
  onClose: () => void;
}

export function QuickPreview({ property, onClose }: QuickPreviewProps) {
  useEffect(() => {
    if (!property) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [property, onClose]);

  return (
    <AnimatePresence>
      {property && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
        >
          <motion.article
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-lift sm:grid-cols-[1.1fr_1fr]"
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink-800 shadow-card hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-[5/4] sm:aspect-auto">
              <Image
                src={property.media.cover}
                alt={property.title}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              {property.verified && (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white shadow-soft">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>

            <div className="p-6">
              <h2 className="text-display-md font-display text-ink-900">
                {property.title}
              </h2>
              <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-ink-500">
                <MapPin className="h-3.5 w-3.5 text-brand-500" />
                {property.location.locality}, {property.location.city}
              </p>
              <p className="mt-4 text-3xl font-bold text-emerald-600">
                {formatInr(property.priceInr)}
              </p>
              <ul className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
                <Fact icon={<Maximize2 className="h-3.5 w-3.5" />} label="Area" value={formatArea(property.areaSqft)} />
                {property.bhk != null && (
                  <Fact icon={<Bed className="h-3.5 w-3.5" />} label="BHK" value={String(property.bhk)} />
                )}
                <Fact icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Trust" value={`${property.trustScore}/100`} />
              </ul>

              {typeof property.distanceKm === "number" && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(property.distanceKm)} from you
                </p>
              )}

              <div className="mt-6 flex gap-2">
                <Link
                  href={`/property/${property.id}`}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 text-[13.5px] font-semibold text-white shadow-glow hover:brightness-105"
                >
                  View details
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-200/70 bg-white p-2">
      <p className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-[12.5px] font-bold text-ink-900">{value}</p>
    </div>
  );
}
