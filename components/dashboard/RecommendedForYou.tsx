"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Loader2, MapPin, ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { useDeviceLocation } from "@/lib/use-device-location";
import { haversineKm } from "@/lib/haversine";
import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

/**
 * Buyer-overview "Recommended for you" section.
 *
 * Server-side we don't know where the user is (Kolkata default would lie to
 * a Patna user), so this client component subscribes to useDeviceLocation
 * and recomputes haversine distance against every catalogue entry from the
 * *real* device coords. Falls back gracefully when geolocation is denied.
 */
export function RecommendedForYou() {
  const { location, requesting } = useDeviceLocation();

  const ranked = useMemo(() => {
    const origin =
      location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
        ? { lat: location.lat, lng: location.lng }
        : DEFAULT_ORIGIN;

    return MOCK_PROPERTIES.map((p) => ({
      ...p,
      distanceKm: haversineKm(origin, p.location.coords),
    })).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [location?.lat, location?.lng]);

  const userCity = location?.city || "your location";
  const top4 = ranked.slice(0, 4);
  const nearest = top4[0]?.distanceKm ?? Infinity;
  const farFromCatalogue = nearest > 200;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-ink-900">Recommended for you</h2>
          <p className="inline-flex items-center gap-1 text-[13px] text-ink-500">
            {requesting && !location ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Detecting your location…
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 text-brand-500" />
                {location ? `Near ${userCity} · sorted by real distance` : "Using default anchor — turn on location for accurate distances"}
              </>
            )}
          </p>
        </div>
        <Link href="/me/recommendations" className="text-[13px] font-semibold text-brand-600 hover:underline">
          See all →
        </Link>
      </div>

      {farFromCatalogue && (
        <div className="mb-4 rounded-2xl border border-amber-200/70 bg-amber-50 p-3 text-[13px] text-amber-800">
          We don't have many listings within 200 km of {userCity} yet. Showing the closest options
          we have — try widening the search radius or browsing by city below.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {top4.map((p) => (
          <PropertyCardWithDistance key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}

/**
 * PropertyCard accepts `distanceKm` on the Property prop and renders it.
 * No wrapper logic needed — just pass through.
 */
function PropertyCardWithDistance({ property }: { property: Property & { distanceKm: number } }) {
  return <PropertyCard property={property} />;
}
