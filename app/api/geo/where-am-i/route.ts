import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { reverseGeocode } from "@/lib/reverse-geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Best-effort IP → city resolver. Free, key-less.
 *
 * Strategy (in order, first that succeeds wins):
 *   1. Cloudflare / Vercel geo headers (if behind that proxy)
 *   2. ip-api.com free tier (45 req/min, no signup) — uses X-Forwarded-For
 *   3. Return `null` so the client falls back to DEFAULT_ORIGIN
 *
 * Localhost requests will fail every check and return null — that's fine,
 * the client should prefer browser geolocation anyway.
 */
async function ipLookup(ip: string): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,lat,lon,city,regionName,country`, {
      signal: AbortSignal.timeout(4_000),
      headers: { "User-Agent": "AapKaPlot/1.0" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { status?: string; lat?: number; lon?: number; city?: string; regionName?: string };
    if (j.status !== "success" || typeof j.lat !== "number" || typeof j.lon !== "number") return null;
    return { lat: j.lat, lng: j.lon, city: j.city ?? "", state: j.regionName ?? "" };
  } catch {
    return null;
  }
}

export async function GET() {
  const h = await headers();

  // 1. Reverse-proxy geo headers (Cloudflare / Vercel set these).
  const cfLat = Number(h.get("cf-iplatitude") ?? "");
  const cfLng = Number(h.get("cf-iplongitude") ?? "");
  const cfCity = h.get("cf-ipcity") ?? "";
  if (Number.isFinite(cfLat) && Number.isFinite(cfLng) && cfLat !== 0) {
    return NextResponse.json({
      source: "cloudflare",
      lat: cfLat,
      lng: cfLng,
      city: cfCity || "",
      state: h.get("cf-region") ?? "",
      country: h.get("cf-ipcountry") ?? "IN",
    });
  }

  // 2. IP lookup.
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  const ipHit = await ipLookup(ip);
  if (ipHit) {
    // Run reverse-geocode for a nicer city label when ip-api lacks one.
    const place = ipHit.city
      ? { city: ipHit.city, state: ipHit.state, country: "IN", lat: ipHit.lat, lng: ipHit.lng, source: "ip" as const }
      : await reverseGeocode(ipHit.lat, ipHit.lng).then((p) => ({ ...p, source: "ip" as const }));
    return NextResponse.json(place);
  }

  // 3. Unable to determine — let the client fall back.
  return NextResponse.json({ source: "unknown", lat: null, lng: null, city: "", state: "", country: "" }, { status: 200 });
}
