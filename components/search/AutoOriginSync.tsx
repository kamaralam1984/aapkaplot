"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeviceLocation } from "@/lib/use-device-location";
import { DEFAULT_ORIGIN } from "@/lib/mock-data";

interface AutoOriginSyncProps {
  /** Current origin coming from the server-resolved URL params (may equal DEFAULT_ORIGIN). */
  currentOrigin: { lat: number; lng: number };
}

const EPS = 1e-4;
const sameOrigin = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) < EPS && Math.abs(a.lng - b.lng) < EPS;

/**
 * Mounted once on /search. If the URL has no explicit lat/lng (which means
 * the server used DEFAULT_ORIGIN), and the browser can resolve a real device
 * location, we rewrite the URL with the resolved coords. The server then
 * re-runs `runSearch` with the right origin and distances become accurate.
 *
 * No UI — silent client effect. Only fires once per page life so the user
 * can still manually pan the map without us hijacking the URL.
 */
export function AutoOriginSync({ currentOrigin }: AutoOriginSyncProps) {
  const { location } = useDeviceLocation();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    // Already overridden via URL — respect the user's pin.
    if (params.get("lat") && params.get("lng")) return;
    // Server is using DEFAULT_ORIGIN; user is actually elsewhere → update URL.
    if (!sameOrigin(currentOrigin, DEFAULT_ORIGIN)) return;

    const next = new URLSearchParams(params.toString());
    next.set("lat", String(location.lat));
    next.set("lng", String(location.lng));
    router.replace(`/search?${next.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng]);

  return null;
}
