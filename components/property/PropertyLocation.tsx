"use client";

import { useMemo, useState } from "react";
import {
  School,
  Stethoscope,
  TrainFront,
  ShoppingBag,
  UtensilsCrossed,
  Landmark,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import type { NearbyKind, NearbyPlace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InteractiveMap } from "@/components/maps/InteractiveMap";

const KIND_META: Record<NearbyKind, { label: string; icon: React.ReactNode; tone: string }> = {
  school:     { label: "Schools",     icon: <School className="h-4 w-4" />,           tone: "bg-emerald-50 text-emerald-600" },
  hospital:   { label: "Hospitals",   icon: <Stethoscope className="h-4 w-4" />,      tone: "bg-rose-50 text-rose-600" },
  metro:      { label: "Metro",       icon: <TrainFront className="h-4 w-4" />,       tone: "bg-violet-50 text-violet-600" },
  market:     { label: "Markets",     icon: <ShoppingBag className="h-4 w-4" />,      tone: "bg-amber-50 text-amber-600" },
  restaurant: { label: "Restaurants", icon: <UtensilsCrossed className="h-4 w-4" />,  tone: "bg-sky-50 text-sky-600" },
  bank:       { label: "Banks",       icon: <Landmark className="h-4 w-4" />,         tone: "bg-slate-100 text-slate-700" },
};

interface PropertyLocationProps {
  lat: number;
  lng: number;
  locality: string;
  city: string;
  state: string;
  nearby: NearbyPlace[];
}

export function PropertyLocation({
  lat,
  lng,
  locality,
  city,
  state,
  nearby,
}: PropertyLocationProps) {
  const [activeKind, setActiveKind] = useState<NearbyKind | "all">("all");

  const kinds = useMemo(
    () => Array.from(new Set(nearby.map((n) => n.kind))) as NearbyKind[],
    [nearby]
  );

  const filtered = useMemo(
    () => (activeKind === "all" ? nearby : nearby.filter((n) => n.kind === activeKind)),
    [nearby, activeKind]
  );

  return (
    <section className="surface-card mt-6 overflow-hidden" aria-labelledby="location-title">
      <div className="px-5 pt-5 lg:px-6 lg:pt-6">
        <h2 id="location-title" className="text-[15px] font-bold text-ink-900">
          Location &amp; Nearby
        </h2>
        <p className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] text-ink-500">
          <MapPin className="h-4 w-4 text-brand-500" />
          {locality}, {city}, {state}
        </p>
      </div>

      {/* Map */}
      <div className="relative mt-4 h-[260px] w-full sm:h-[320px]">
        <InteractiveMap
          center={{ lat, lng }}
          zoom={14}
          origin={{ lat, lng }}
          markers={[]}
          className="absolute inset-0"
        />
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4 lg:px-6">
        <Chip
          active={activeKind === "all"}
          onClick={() => setActiveKind("all")}
        >
          All
        </Chip>
        {kinds.map((k) => (
          <Chip
            key={k}
            active={activeKind === k}
            onClick={() => setActiveKind(k)}
            icon={KIND_META[k].icon}
          >
            {KIND_META[k].label}
          </Chip>
        ))}
      </div>

      {/* Nearby list */}
      <ul className="mt-3 grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:px-6 lg:pb-6">
        {filtered.map((n, i) => (
          <motion.li
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            className="flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white px-3 py-2.5"
          >
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", KIND_META[n.kind].tone)}>
              {KIND_META[n.kind].icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-ink-900">{n.name}</p>
              <p className="text-[12px] text-ink-500">
                {KIND_META[n.kind].label.replace(/s$/, "")}
                {n.rating != null && <> · ★ {n.rating.toFixed(1)}</>}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11.5px] font-semibold text-brand-700">
              {n.distanceKm < 1 ? `${Math.round(n.distanceKm * 1000)} m` : `${n.distanceKm.toFixed(1)} km`}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition",
        active
          ? "border-transparent bg-ink-900 text-white shadow-soft"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
