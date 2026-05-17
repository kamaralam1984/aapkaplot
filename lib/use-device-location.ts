"use client";

import { useEffect, useState, useCallback } from "react";

export interface DeviceLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
  accuracyM: number | null;
  source: "gps" | "ip" | "manual" | "stored";
  /** True when the source is approximate (IP geo, or GPS with poor radius).
   *  UI uses this to surface "refine" prompts. */
  approximate?: boolean;
  resolvedAt: number;
}

// v2 — drops any v1 cache that may have stored a low-accuracy WPS fix
// (e.g. 455 km from Kolkata). Existing localStorage entries silently expire
// and users get a fresh prompt to set their city.
const STORAGE_KEY = "akp.device-location.v2";

// Different freshness windows per source — IP-based misdetections (common on
// shared WiFi where the upstream NAT exits in another city) should expire
// fast so the user isn't stuck with the wrong location for an hour. Manual /
// GPS values are trustworthy enough to keep for a day.
const TTL_BY_SOURCE: Record<DeviceLocation["source"], number> = {
  manual:  24 * 60 * 60 * 1000,  // 24 h — user explicitly picked this
  gps:     60 * 60 * 1000,       // 1 h
  stored:  60 * 60 * 1000,
  ip:      10 * 60 * 1000,       // 10 min — re-check frequently
};

/** Anything coarser than 10 km is treated as approximate (WiFi positioning
 *  or IP fallback). Genuine GPS fixes on mobile clock in well under 100 m;
 *  laptops without GPS hardware typically return ≥ 5 km. */
const GPS_GOOD_ACCURACY_M = 10_000;

/** Anything coarser than 50 km is useless for nearby-search distances and
 *  almost always reflects WPS/IP guessing. Reject outright so the UI prompts
 *  the user to set their city manually instead of silently centering the
 *  map on the wrong metro. */
const GPS_REJECT_ACCURACY_M = 50_000;

function readCache(): DeviceLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceLocation;
    const ttl = TTL_BY_SOURCE[parsed.source] ?? 60 * 60 * 1000;
    if (Date.now() - parsed.resolvedAt > ttl) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(loc: DeviceLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    window.dispatchEvent(new CustomEvent("akp:device-location", { detail: loc }));
  } catch {
    // localStorage blocked — ignore
  }
}

function clearCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function reverseClient(lat: number, lng: number): Promise<{ city: string; state: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=10&accept-language=en`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return { city: "", state: "" };
    const data = await res.json();
    const a = data.address ?? {};
    return {
      city: a.city ?? a.town ?? a.village ?? a.suburb ?? a.state_district ?? "",
      state: a.state ?? "",
    };
  } catch {
    return { city: "", state: "" };
  }
}

/**
 * Forward-geocode a free-text query (e.g. "Patna" or "Phulwari Sharif Bihar")
 * via free OSM Nominatim — used by the manual override UI.
 */
export async function searchPlaces(q: string): Promise<{ lat: number; lng: number; city: string; state: string; label: string }[]> {
  if (!q.trim()) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=6&countrycodes=in&accept-language=en`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; suburb?: string; state?: string } }>;
    return rows
      .map((r) => {
        const a = r.address ?? {};
        return {
          lat: Number(r.lat),
          lng: Number(r.lon),
          city: a.city ?? a.town ?? a.village ?? a.suburb ?? "",
          state: a.state ?? "",
          label: r.display_name,
        };
      })
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
  } catch {
    return [];
  }
}

/**
 * Reactive device-location hook.
 *
 * Resolution order:
 *   1. Stored value within its per-source TTL — instant.
 *   2. Browser geolocation API. Marked **approximate** when accuracy ≥ 10 km
 *      (which usually means WiFi positioning, not true GPS).
 *   3. Server IP lookup via /api/geo/where-am-i — flagged approximate.
 *      Many ISPs in India NAT through metro POPs, so this commonly returns
 *      the wrong city; the UI must give the user a clear manual override.
 *
 * Always cross-references coords with Nominatim to fill in a human city/state
 * so the navbar chip can show the right name when the device is correct.
 */
export function useDeviceLocation() {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback((loc: DeviceLocation) => {
    writeCache(loc);
    setLocation(loc);
  }, []);

  const resolve = useCallback(async () => {
    setRequesting(true);
    setError(null);

    // 1. Try browser geolocation first.
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: 0, // force a fresh fix so WiFi roaming doesn't replay a stale cell
          });
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // Hard-reject useless fixes (e.g. 455 km accuracy from WPS guessing).
        // Wipe any stale cached value too so the chip stops showing the
        // wrong metro. User will be prompted to pick their city manually.
        if (accuracy > GPS_REJECT_ACCURACY_M) {
          clearCache();
          setLocation(null);
          setError(
            `Couldn't pin your exact location (±${(accuracy / 1000).toFixed(0)} km — too coarse). Please pick your city below.`,
          );
          setRequesting(false);
          return null;
        }

        const { city, state } = await reverseClient(lat, lng);
        const loc: DeviceLocation = {
          lat, lng, city, state,
          accuracyM: accuracy,
          source: "gps",
          approximate: accuracy > GPS_GOOD_ACCURACY_M,
          resolvedAt: Date.now(),
        };
        set(loc);
        setRequesting(false);
        return loc;
      } catch (err) {
        const e = err as GeolocationPositionError;
        if (e?.code === 1) setError("Location permission denied. Pick your city manually for accurate distances.");
        else if (e?.code === 3) setError("Couldn't get a fix in time. Pick your city manually.");
        else setError("Couldn't read your location. Please pick your city manually.");
        setRequesting(false);
        return null;
      }
    }

    // No browser geolocation API (rare). Tell the user; don't silently
    // fall back to IP — IP geo on Indian ISPs commonly returns the wrong
    // metro (the upstream NAT POP), which is exactly the problem we're
    // solving here.
    setError("Geolocation isn't available in this browser. Please pick your city manually.");
    setRequesting(false);
    return null;
  }, [set]);

  // Hydrate from cache *after* mount (avoids SSR/CSR mismatch), then resolve
  // a fresh fix if the cache is empty.
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setLocation(cached);
    } else {
      resolve();
    }
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<DeviceLocation>).detail;
      if (detail) setLocation(detail);
    };
    window.addEventListener("akp:device-location", sync);
    return () => window.removeEventListener("akp:device-location", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManual = useCallback((lat: number, lng: number, city: string, state = "") => {
    set({
      lat, lng, city, state,
      accuracyM: null,
      source: "manual",
      approximate: false,
      resolvedAt: Date.now(),
    });
  }, [set]);

  const reset = useCallback(() => {
    clearCache();
    setLocation(null);
  }, []);

  return { location, requesting, error, resolve, setManual, reset };
}
