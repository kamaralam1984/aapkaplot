"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Crosshair, Loader2, Search, X, AlertCircle, Check } from "lucide-react";
import { useDeviceLocation, searchPlaces } from "@/lib/use-device-location";
import { cn } from "@/lib/utils";

/**
 * Navbar location chip with a popover that lets the user:
 *  • See the current detected location + its source (GPS / IP / Manual).
 *  • Re-trigger GPS detection.
 *  • Search for a city manually — primary fix for users on shared/ISP-NAT
 *    WiFi where IP geo lands them in the wrong metro.
 *
 * IP-derived and low-accuracy GPS results show a clear "approximate" hint.
 */
export function LocationChip({ className }: { className?: string }) {
  const { location, requesting, error, resolve, setManual } = useDeviceLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchPlaces>>>([]);
  const [searching, setSearching] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Debounce city search.
  useEffect(() => {
    const t = query.trim();
    if (t.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const rows = await searchPlaces(t);
      setResults(rows);
      setSearching(false);
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const label = requesting
    ? "Detecting…"
    : location?.city
    ? location.city
    : "Set location";
  const approximate = location?.approximate;
  const sourceLabel =
    location?.source === "gps"
      ? approximate
        ? "GPS · approximate"
        : "GPS"
      : location?.source === "ip"
      ? "IP — approximate"
      : location?.source === "manual"
      ? "Manual"
      : "—";

  return (
    <div className={cn("relative", className)} ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={location ? `${location.city || "Unknown"}, ${location.state} · source: ${sourceLabel}` : "Set your location"}
        className="inline-flex h-10 w-full items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-700 shadow-soft transition hover:border-brand-500/40 hover:text-ink-900 md:w-auto"
      >
        {requesting ? (
          <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
        ) : (
          <MapPin className={cn("h-4 w-4", approximate ? "text-amber-500" : "text-brand-500")} />
        )}
        <span className="max-w-[14ch] truncate">{label}</span>
        {approximate && <span className="text-[10.5px] font-bold uppercase text-amber-600">approx</span>}
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 w-full min-w-[280px] rounded-2xl border border-ink-200 bg-white p-3 shadow-lift md:left-auto md:right-0 md:w-[320px]">
          {/* Current value */}
          {location ? (
            <div className="flex items-start gap-2 rounded-xl bg-ink-50/60 px-3 py-2">
              <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", approximate ? "text-amber-500" : "text-brand-500")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink-900">
                  {location.city || "Unknown"}
                  {location.state ? <span className="text-ink-500">, {location.state}</span> : null}
                </p>
                <p className="text-[11.5px] text-ink-500">
                  Source: {sourceLabel}
                  {location.accuracyM ? ` · ±${(location.accuracyM / 1000).toFixed(1)} km` : ""}
                </p>
                {approximate && (
                  <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-amber-700">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    Distances may be off — re-detect or pick your city below.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-3 py-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink-900">No location set</p>
                <p className="text-[11.5px] text-ink-500">
                  Detect via GPS or pick your city below for accurate distances.
                </p>
              </div>
            </div>
          )}

          {/* Re-detect */}
          <button
            type="button"
            disabled={requesting}
            onClick={async () => { await resolve(); }}
            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-brand-500/40 bg-brand-50 px-3 text-[13px] font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
          >
            {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            Re-detect via device GPS
          </button>

          {error && (
            <p className="mt-2 text-[11.5px] text-rose-700">{error}</p>
          )}

          {/* Manual search */}
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Or pick a city manually
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Patna, Phulwari Sharif, Mumbai…"
                className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searching && (
              <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
              </div>
            )}

            {!searching && results.length > 0 && (
              <ul className="mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-ink-200">
                {results.map((r, i) => (
                  <li key={`${r.lat}-${r.lng}-${i}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setManual(r.lat, r.lng, r.city || r.label.split(",")[0], r.state);
                        setOpen(false);
                        setQuery("");
                        setResults([]);
                      }}
                      className="flex w-full items-start gap-2 border-b border-ink-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-brand-50"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500 opacity-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink-900">
                          {r.city || r.label.split(",")[0]}
                          {r.state ? <span className="text-ink-500">, {r.state}</span> : null}
                        </span>
                        <span className="block truncate text-[11px] text-ink-500">{r.label}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!searching && query.length >= 2 && results.length === 0 && (
              <p className="mt-2 text-[12px] text-ink-500">No matches in India. Try a different name.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
