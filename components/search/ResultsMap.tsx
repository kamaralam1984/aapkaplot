"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatInr } from "@/lib/format";
import { formatDistance } from "@/lib/haversine";
import { computeBounds } from "@/lib/search";
import { cn } from "@/lib/utils";
import { InteractiveMap, type MapMarker } from "@/components/maps/InteractiveMap";

interface ResultsMapProps {
  origin: { lat: number; lng: number };
  items: (Property & { distanceKm: number })[];
  highlightId?: string | null;
  onHover?: (id: string | null) => void;
  className?: string;
}

export function ResultsMap({
  origin,
  items,
  highlightId,
  onHover,
  className,
}: ResultsMapProps) {
  const [popoverId, setPopoverId] = useState<string | null>(null);

  const bounds = useMemo(() => computeBounds(origin, items), [origin, items]);

  const markers = useMemo<MapMarker[]>(
    () =>
      items.map((p) => ({
        id: p.id,
        lat: p.location.coords.lat,
        lng: p.location.coords.lng,
        label: formatInr(p.priceInr),
        highlight: highlightId === p.id || popoverId === p.id,
        onClick: () => setPopoverId((cur) => (cur === p.id ? null : p.id)),
      })),
    [items, highlightId, popoverId]
  );

  const popoverItem = items.find((i) => i.id === popoverId);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border border-ink-200/70 bg-emerald-50/40 shadow-card",
        className
      )}
      onMouseLeave={() => onHover?.(null)}
    >
      <InteractiveMap
        center={origin}
        zoom={11}
        origin={origin}
        markers={markers}
        bounds={bounds}
        className="absolute inset-0"
      />

      {/* Popover card */}
      <AnimatePresence>
        {popoverItem && (
          <motion.div
            key={popoverItem.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute left-1/2 top-4 z-30 w-[300px] -translate-x-1/2 rounded-2xl border border-ink-200 bg-white p-3 shadow-lift"
          >
            <Link
              href={`/property/${popoverItem.id}`}
              className="flex gap-3"
            >
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                <Image
                  src={popoverItem.media.cover}
                  alt={popoverItem.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink-900">
                  {popoverItem.title}
                </p>
                <p className="text-[14px] font-bold text-emerald-600">
                  {formatInr(popoverItem.priceInr)}
                </p>
                <p className="inline-flex items-center gap-1 truncate text-[11.5px] text-ink-500">
                  <MapPin className="h-3 w-3 text-brand-500" />
                  {popoverItem.location.locality}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-500">
                  <span>{formatDistance(popoverItem.distanceKm)}</span>
                  {popoverItem.verified && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count chip */}
      <div className="absolute bottom-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-ink-800 shadow-card backdrop-blur-sm">
        {items.length} on map
      </div>
    </div>
  );
}

