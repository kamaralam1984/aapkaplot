"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Price label rendered on the marker (e.g. "₹45 L"). */
  label?: string;
  /** Whether this marker is the current highlight. */
  highlight?: boolean;
  /** Click handler — wired by the parent. */
  onClick?: () => void;
}

export interface InteractiveMapProps {
  /** Center + zoom of the initial viewport. */
  center: { lat: number; lng: number };
  zoom?: number;
  /** Property markers rendered on top. */
  markers?: MapMarker[];
  /** Highlight + ring around the user's reference location. */
  origin?: { lat: number; lng: number };
  /** Toggle between street + satellite. */
  view?: "map" | "satellite";
  /** Optional fit-to-bounds rectangle (overrides center+zoom on mount). */
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  /** Disable interactivity (used when the map is a passive preview). */
  interactive?: boolean;
  className?: string;
  /** Fallback when no token is configured. */
  fallback?: React.ReactNode;
}

const STYLE_URLS: Record<NonNullable<InteractiveMapProps["view"]>, string> = {
  map: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export function InteractiveMap({
  center,
  zoom = 12,
  markers = [],
  origin,
  view = "map",
  bounds,
  interactive = true,
  className,
  fallback,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ── Initialise the map exactly once ──
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URLS[view],
      center: [center.lng, center.lat],
      zoom,
      interactive,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    if (interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => setReady(true));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRefs.current.clear();
      originMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Style switch ──
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(STYLE_URLS[view]);
  }, [view]);

  // ── Fit to bounds when supplied ──
  useEffect(() => {
    if (!ready || !mapRef.current || !bounds) return;
    mapRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 40, duration: 400, maxZoom: 14 }
    );
  }, [ready, bounds]);

  // ── Origin marker (pulsing emerald dot) ──
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
    if (!origin) return;
    const el = document.createElement("div");
    el.className = "akp-origin-marker";
    el.innerHTML = `
      <span class="akp-origin-pulse"></span>
      <span class="akp-origin-dot"></span>
    `;
    originMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([origin.lng, origin.lat])
      .addTo(mapRef.current);
  }, [ready, origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Property markers ──
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const next = new Set(markers.map((m) => m.id));

    // Remove markers no longer present
    for (const [id, marker] of markerRefs.current) {
      if (!next.has(id)) {
        marker.remove();
        markerRefs.current.delete(id);
      }
    }

    // Add / update remaining
    for (const m of markers) {
      const existing = markerRefs.current.get(m.id);
      const el =
        (existing?.getElement() as HTMLButtonElement | undefined) ??
        document.createElement("button");
      el.className = cn("akp-price-marker", m.highlight && "is-highlight");
      el.type = "button";
      el.innerHTML = `<span>${m.label ?? ""}</span>`;
      el.onclick = (e) => {
        e.stopPropagation();
        m.onClick?.();
      };
      if (existing) {
        existing.setLngLat([m.lng, m.lat]);
      } else {
        const created = new mapboxgl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(mapRef.current!);
        markerRefs.current.set(m.id, created);
      }
    }
  }, [ready, markers]);

  if (!token) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden rounded-2xl bg-emerald-50/40", className)}>
        {fallback ?? <FallbackArt />}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-2xl", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Inline styles for markers + origin dot. */}
      <style jsx global>{`
        .akp-price-marker {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #10b981;
          color: white;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
          cursor: pointer;
          transition: transform 120ms ease;
          border: none;
          white-space: nowrap;
        }
        .akp-price-marker::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          width: 8px;
          height: 8px;
          transform: translate(-50%, -50%) rotate(45deg);
          background: inherit;
        }
        .akp-price-marker:hover {
          transform: scale(1.05);
        }
        .akp-price-marker.is-highlight {
          background: #0f172a;
          z-index: 20;
          transform: scale(1.1);
        }
        .akp-origin-marker {
          position: relative;
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
        }
        .akp-origin-pulse {
          position: absolute;
          inset: -8px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.35);
          animation: akp-origin-pulse 2.2s ease-out infinite;
        }
        .akp-origin-dot {
          position: relative;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #10b981;
          border: 3px solid white;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3), 0 8px 18px -6px rgba(16, 185, 129, 0.6);
        }
        @keyframes akp-origin-pulse {
          0%   { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function FallbackArt() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#eaf7f1,#d7eee2_38%,#f1f5f9_70%)]">
      <div className="dot-grid absolute inset-0 opacity-60" />
      <p className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-ink-500 shadow-soft backdrop-blur-md">
        Set NEXT_PUBLIC_MAPBOX_TOKEN to render the live map
      </p>
    </div>
  );
}
