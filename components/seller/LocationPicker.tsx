"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, MapPin, Pentagon, Trash2, Loader2 } from "lucide-react";

const STREET_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 }; // geographic centre of India

/** GeoJSON polygon ring — array of [lng, lat] pairs. */
export type BoundaryRing = [number, number][];

export interface LocationValue {
  lat: number | null;
  lng: number | null;
  /** Optional polygon. First/last point auto-closed when sent to the server. */
  boundary: BoundaryRing;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  /** Reverse-geocode callback — when present, the picker calls it after a
   *  successful "Use my location" so the parent can pre-fill city/state. */
  onReverseGeo?: (geo: { city: string; state: string }) => void;
  className?: string;
}

type Mode = "pin" | "draw";

export function LocationPicker({ value, onChange, onReverseGeo, className }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("pin");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest mode + value accessible inside MapLibre event handlers without
  // re-binding (maplibre fires raw DOM events).
  const modeRef = useRef(mode);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Map init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start = value.lat && value.lng
      ? { lat: value.lat, lng: value.lng, zoom: 16 }
      : { ...INDIA_CENTER, zoom: 4 };

    const m = new maplibregl.Map({
      container: containerRef.current,
      style: STREET_STYLE,
      center: [start.lng, start.lat],
      zoom: start.zoom,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    m.on("load", () => {
      // Boundary source + line/fill layers.
      m.addSource("akp-boundary", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "akp-boundary-fill",
        type: "fill",
        source: "akp-boundary",
        paint: { "fill-color": "#10b981", "fill-opacity": 0.18 },
      });
      m.addLayer({
        id: "akp-boundary-line",
        type: "line",
        source: "akp-boundary",
        paint: { "line-color": "#059669", "line-width": 2.4 },
      });
      m.addLayer({
        id: "akp-boundary-vertices",
        type: "circle",
        source: "akp-boundary",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#10b981",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      setReady(true);
    });

    m.on("click", (e) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      const cur = valueRef.current;
      if (modeRef.current === "pin") {
        onChangeRef.current({ ...cur, lat, lng });
      } else {
        // draw mode: append a vertex
        const ring = [...cur.boundary, [lng, lat] as [number, number]];
        onChangeRef.current({ ...cur, boundary: ring });
      }
    });

    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reflect pin marker ───────────────────────────────────────────────
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready) return;
    if (value.lat == null || value.lng == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#10b981", draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(m);
      markerRef.current.on("dragend", () => {
        const ll = markerRef.current?.getLngLat();
        if (ll) onChangeRef.current({ ...valueRef.current, lat: ll.lat, lng: ll.lng });
      });
    } else {
      markerRef.current.setLngLat([value.lng, value.lat]);
    }
  }, [ready, value.lat, value.lng]);

  // ── Reflect boundary polygon ─────────────────────────────────────────
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready) return;
    const src = m.getSource("akp-boundary") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    if (value.boundary.length >= 3) {
      const ring: [number, number][] = [...value.boundary, value.boundary[0]];
      features.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [ring] },
        properties: {},
      });
    }
    value.boundary.forEach((pt) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: pt },
        properties: {},
      });
    });
    src.setData({ type: "FeatureCollection", features });
  }, [ready, value.boundary]);

  // ── Geolocate ────────────────────────────────────────────────────────
  const useCurrentLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setError(null);
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60_000,
        }),
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      onChangeRef.current({ ...valueRef.current, lat, lng });
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, speed: 1.4 });

      // Reverse-geocode via free Nominatim (no key, polite User-Agent below).
      if (onReverseGeo) {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } },
          );
          if (r.ok) {
            const data = (await r.json()) as { address?: { city?: string; town?: string; village?: string; state?: string } };
            const a = data.address ?? {};
            onReverseGeo({
              city: a.city ?? a.town ?? a.village ?? "",
              state: a.state ?? "",
            });
          }
        } catch {
          /* reverse-geocode is best-effort */
        }
      }
    } catch (e) {
      const code = (e as GeolocationPositionError).code;
      if (code === 1) setError("Location permission denied — enable it in your browser.");
      else if (code === 3) setError("Couldn't get a fix in time. Try again outside or near a window.");
      else setError("Couldn't read your location.");
    } finally {
      setLocating(false);
    }
  }, [onReverseGeo]);

  const clearBoundary = () => onChangeRef.current({ ...valueRef.current, boundary: [] });
  const undoLastVertex = () =>
    onChangeRef.current({ ...valueRef.current, boundary: valueRef.current.boundary.slice(0, -1) });

  const cur = value;
  const fmt = (n: number | null) => (n == null ? "—" : n.toFixed(6));

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-50 px-3.5 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Use my location
        </button>

        <div role="tablist" className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "pin"}
            onClick={() => setMode("pin")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition ${
              mode === "pin" ? "bg-ink-900 text-white shadow-soft" : "text-ink-700 hover:bg-ink-100/60"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> Drop pin
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "draw"}
            onClick={() => setMode("draw")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition ${
              mode === "draw" ? "bg-ink-900 text-white shadow-soft" : "text-ink-700 hover:bg-ink-100/60"
            }`}
          >
            <Pentagon className="h-3.5 w-3.5" /> Draw boundary
          </button>
        </div>

        {mode === "draw" && (
          <>
            <button
              type="button"
              onClick={undoLastVertex}
              disabled={cur.boundary.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-700 hover:bg-ink-100/60 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearBoundary}
              disabled={cur.boundary.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[12.5px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </>
        )}

        <span className="ml-auto text-[11.5px] text-ink-500">
          {mode === "pin"
            ? cur.lat == null
              ? "Click the map or use GPS to drop a pin."
              : "Click anywhere to move the pin · drag the marker to fine-tune."
            : `Click to add corners (need ≥ 3) — ${cur.boundary.length} added.`}
        </span>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="h-[360px] w-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-100"
      />

      {/* Coords + manual input */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Pin coordinates</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.000001"
              value={cur.lat ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                onChange({ ...cur, lat: v });
              }}
              placeholder="Latitude"
              className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-[13px] tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <input
              type="number"
              step="0.000001"
              value={cur.lng ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                onChange({ ...cur, lng: v });
              }}
              placeholder="Longitude"
              className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-[13px] tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-500">
            {fmt(cur.lat)}°, {fmt(cur.lng)}° {cur.lat != null && cur.lng != null && "· editable"}
          </p>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Boundary polygon</p>
          {cur.boundary.length === 0 ? (
            <p className="mt-1.5 text-[12.5px] text-ink-500">
              Optional. Switch to <strong>Draw boundary</strong> mode and click the map to add corners. Useful for plots, farms, large compounds.
            </p>
          ) : cur.boundary.length < 3 ? (
            <p className="mt-1.5 text-[12.5px] text-amber-700">
              {cur.boundary.length} corner{cur.boundary.length === 1 ? "" : "s"} — need at least 3 to form a closed shape.
            </p>
          ) : (
            <p className="mt-1.5 text-[12.5px] text-emerald-700">
              ✓ {cur.boundary.length}-sided polygon set. Will be saved with the listing.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 inline-flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
