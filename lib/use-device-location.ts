"use client";

import { useEffect, useState, useCallback } from "react";

export interface DeviceLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
  accuracyM: number | null;
  source: "gps" | "ip" | "manual" | "stored";
  resolvedAt: number;
}

const STORAGE_KEY = "akp.device-location.v1";
const STORAGE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readCache(): DeviceLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceLocation;
    if (Date.now() - parsed.resolvedAt > STORAGE_TTL_MS) return null;
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
 * Reactive device-location hook.
 *
 * Resolution order:
 *   1. Stored value (≤ 1 hour old) — instant
 *   2. Browser geolocation (GPS on mobile, WiFi/IP on desktop) — most accurate
 *   3. Server IP lookup via /api/geo/where-am-i — best effort
 *
 * Always cross-references the GPS coords with Nominatim to fill in a
 * human-readable city/state so the navbar chip stops saying "Kolkata"
 * for users elsewhere in India.
 */
export function useDeviceLocation() {
  // Start with null on both server and client so SSR markup matches the
  // first client render. The cached value is hydrated inside useEffect
  // below — otherwise we get a hydration mismatch on routes where the
  // chip label depends on the location (server: "Detect", client: "Patna").
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

    // 1. Try browser geolocation first — most accurate, no network needed.
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10_000,
            maximumAge: 5 * 60 * 1000,
          });
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { city, state } = await reverseClient(lat, lng);
        const loc: DeviceLocation = {
          lat, lng, city, state,
          accuracyM: pos.coords.accuracy,
          source: "gps",
          resolvedAt: Date.now(),
        };
        set(loc);
        setRequesting(false);
        return loc;
      } catch (err) {
        const e = err as GeolocationPositionError;
        if (e?.code === 1) setError("Permission denied — using IP location instead.");
        else if (e?.code === 3) setError("Geolocation timed out — using IP location instead.");
        // fall through to IP lookup
      }
    }

    // 2. Server IP lookup (best-effort).
    try {
      const res = await fetch("/api/geo/where-am-i", { cache: "no-store" });
      const data = await res.json();
      if (typeof data?.lat === "number" && typeof data?.lng === "number") {
        const loc: DeviceLocation = {
          lat: data.lat,
          lng: data.lng,
          city: data.city ?? "",
          state: data.state ?? "",
          accuracyM: null,
          source: "ip",
          resolvedAt: Date.now(),
        };
        set(loc);
        setRequesting(false);
        return loc;
      }
    } catch {
      // ignore
    }

    setRequesting(false);
    return null;
  }, [set]);

  // Hydrate from cache *after* mount (avoids SSR/CSR mismatch), then
  // resolve a fresh fix if the cache is empty.
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
    set({ lat, lng, city, state, accuracyM: null, source: "manual", resolvedAt: Date.now() });
  }, [set]);

  return { location, requesting, error, resolve, setManual };
}
