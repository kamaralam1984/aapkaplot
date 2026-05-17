"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Minus, Locate, Satellite, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInr } from "@/lib/format";
import type { Property } from "@/lib/types";
import { InteractiveMap, type MapMarker } from "@/components/maps/InteractiveMap";
import { DEFAULT_ORIGIN } from "@/lib/mock-data";
import { haversineKm } from "@/lib/haversine";

// Search radius slider: 0 km → 20,000 km in 5 km steps (original wide range).
const RADIUS_MIN_KM = 0;
const RADIUS_MAX_KM = 20000;
const RADIUS_STEP_KM = 5;

function formatRadius(km: number): string {
  if (km === 0) return "0 km";
  return `${km.toLocaleString("en-IN")} km`;
}

interface MapPreviewProps {
  properties: Property[];
  /** Where to centre the map + label as "Your Location". Falls back to Kolkata. */
  center?: { lat: number; lng: number };
  city?: string;
  state?: string;
}

/**
 * Stylized map preview using a static Mapbox tile. When NEXT_PUBLIC_MAPBOX_TOKEN
 * is set, the URL renders a real basemap. Otherwise we fall back to a CSS
 * artwork so the page never breaks during local dev.
 */
export function MapPreview({
  properties,
  center,
  city = "Kolkata",
  state = "West Bengal",
}: MapPreviewProps) {
  const [view, setView] = useState<"map" | "satellite">("map");
  const [radius, setRadius] = useState(20); // km — default 20 km (slider goes 0–20,000)
  const origin = center ?? DEFAULT_ORIGIN;

  // Only show properties within the chosen radius of the user's origin —
  // this is what the slider is supposed to do but never wired before.
  const liveMarkers = useMemo<MapMarker[]>(
    () =>
      properties
        .map((p) => ({ p, dKm: haversineKm(origin, p.location.coords) }))
        .filter(({ dKm }) => dKm <= radius)
        .slice(0, 8)
        .map(({ p }) => ({
          id: p.id,
          lat: p.location.coords.lat,
          lng: p.location.coords.lng,
          label: formatInr(p.priceInr),
        })),
    [properties, origin.lat, origin.lng, radius]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-[460px] w-full overflow-hidden rounded-3xl border border-ink-200/70 bg-emerald-50/40 shadow-lift lg:h-[520px]"
    >
      {/* Base map — MapLibre + OpenFreeMap (free, no token) */}
      <InteractiveMap
        center={origin}
        zoom={11}
        origin={origin}
        view={view}
        interactive
        markers={liveMarkers}
        className="absolute inset-0"
      />

      {/* Floating "Your Location" card */}
      <div className="absolute left-4 top-4 z-10 w-64 rounded-2xl border border-white/70 bg-white/90 p-3.5 shadow-lift backdrop-blur-xl">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-glow">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
              Your Location
            </p>
            <p className="truncate text-[14px] font-semibold text-ink-900">
              {city}, {state}
            </p>
          </div>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
              Search Radius
            </span>
            <span className="text-[12px] font-semibold text-brand-700">
              {formatRadius(radius)}
            </span>
          </div>
          <input
            type="range"
            min={RADIUS_MIN_KM}
            max={RADIUS_MAX_KM}
            step={RADIUS_STEP_KM}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="mt-2 w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10.5px] font-medium text-ink-400">
            <span>{RADIUS_MIN_KM} km</span>
            <span>{RADIUS_MAX_KM} km</span>
          </div>
          <p className="mt-1 text-[10.5px] text-ink-500">
            Showing {liveMarkers.length} {liveMarkers.length === 1 ? "listing" : "listings"} within {radius} km
          </p>
        </div>
      </div>

      {/* View toggle */}
      <div className="absolute right-4 top-4 z-10 flex rounded-xl border border-white/70 bg-white/85 p-1 shadow-card backdrop-blur-xl">
        <ToggleBtn active={view === "map"} onClick={() => setView("map")} icon={<MapIcon className="h-3.5 w-3.5" />}>
          Map
        </ToggleBtn>
        <ToggleBtn active={view === "satellite"} onClick={() => setView("satellite")} icon={<Satellite className="h-3.5 w-3.5" />}>
          Satellite
        </ToggleBtn>
      </div>

      {/* Zoom + locate */}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        <RoundCtl ariaLabel="Zoom in"><Plus className="h-4 w-4" /></RoundCtl>
        <RoundCtl ariaLabel="Zoom out"><Minus className="h-4 w-4" /></RoundCtl>
      </div>
      <div className="absolute bottom-4 right-4 z-10">
        <RoundCtl ariaLabel="Locate me"><Locate className="h-4 w-4" /></RoundCtl>
      </div>
    </motion.div>
  );
}

function ToggleBtn({
  active,
  icon,
  children,
  ...props
}: { active: boolean; icon: React.ReactNode; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition",
        active ? "bg-ink-900 text-white shadow-soft" : "text-ink-700 hover:bg-ink-100"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function RoundCtl({
  children,
  ariaLabel,
}: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="grid h-9 w-9 place-items-center rounded-xl border border-white/70 bg-white/95 text-ink-700 shadow-card backdrop-blur-xl transition hover:bg-white hover:text-ink-900"
    >
      {children}
    </button>
  );
}

const SAMPLE_MARKERS = [
  { id: "m1", top: "20%", left: "30%", price: "₹25 L" },
  { id: "m2", top: "17%", left: "55%", price: "₹45 L" },
  { id: "m3", top: "44%", left: "33%", price: "₹35 L" },
  { id: "m4", top: "42%", left: "65%", price: "₹55 L" },
  { id: "m5", top: "62%", left: "58%", price: "₹80 L" },
];

function PriceMarker({ top, left, price }: { top: string; left: string; price: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute z-[5]"
      style={{ top, left }}
    >
      <span className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white shadow-lift">
        {price}
      </span>
      <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-emerald-500" />
    </motion.div>
  );
}

function RadiusRing() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2">
      <span className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 ring-2 ring-emerald-400/40" />
      <span className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 ring-2 ring-emerald-400/40" />
      <span className="relative grid h-5 w-5 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-500/40" />
        <span className="relative h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white shadow-glow" />
      </span>
    </div>
  );
}

function FallbackMapArt({ view }: { view: "map" | "satellite" }) {
  return (
    <div
      className={cn(
        "absolute inset-0",
        view === "map"
          ? "bg-[radial-gradient(circle_at_50%_50%,#eaf7f1,#d7eee2_38%,#f1f5f9_70%)]"
          : "bg-[radial-gradient(circle_at_50%_50%,#1e293b,#0f172a)]"
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          view === "map" ? "dot-grid opacity-60" : "dot-grid opacity-20"
        )}
      />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M0,60 Q30,40 50,50 T100,40" stroke={view === "map" ? "#94a3b8" : "#64748b"} strokeWidth="0.4" fill="none" opacity="0.6" />
        <path d="M0,30 Q40,55 70,35 T100,55" stroke={view === "map" ? "#cbd5e1" : "#475569"} strokeWidth="0.3" fill="none" opacity="0.5" />
        <path d="M20,0 L25,100" stroke={view === "map" ? "#cbd5e1" : "#475569"} strokeWidth="0.2" fill="none" opacity="0.6" />
        <path d="M80,0 L70,100" stroke={view === "map" ? "#cbd5e1" : "#475569"} strokeWidth="0.2" fill="none" opacity="0.5" />
      </svg>
    </div>
  );
}
