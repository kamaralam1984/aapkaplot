import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSession } from "@/lib/auth-server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ ok: false, mode: "db_disabled" });

/**
 * POST /api/track/visit
 *
 * Client-side beacon. The first hit creates a Visit row, subsequent
 * hits update `lastSeenAt`, bump `pageviews`, and append the current
 * property id (if any) to `propertiesViewed`. Geo enrichment comes
 * straight from Cloudflare Tunnel's edge headers — no extra API call.
 *
 * Body: { sessionId, path, propertyId? }
 *   sessionId — long-lived random id stored client-side (localStorage).
 */
const Body = z.object({
  sessionId: z.string().min(8).max(64),
  path: z.string().min(1).max(500).optional(),
  propertyId: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  // Beacon fires on every page nav + heartbeat — cap at 60/min per IP so
  // a misbehaving client can't melt the Visit table.
  const limited = await rateLimit(req, { key: "visit", limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  if (process.env.USE_DB !== "1") return dbOff();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  const { sessionId, path, propertyId } = parsed.data;

  const h = await headers();
  const session = await getSession();
  const ip =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    null;

  // Cloudflare auto-sets these on every request once you enable the
  // Edge IP Geolocation toggle. We treat all fields as optional.
  const country = h.get("cf-ipcountry") || null;
  const region = h.get("cf-region") || null;
  const city = h.get("cf-ipcity") || null;
  const postalCode = h.get("cf-postal-code") || null;
  const district = h.get("cf-region-code") || null;
  const lat = numOrNull(h.get("cf-iplatitude"));
  const lng = numOrNull(h.get("cf-iplongitude"));
  const userAgent = h.get("user-agent") ?? null;
  const referrer = h.get("referer") ?? null;

  try {
    const existing = await prisma.visit.findUnique({ where: { sessionId } });
    if (existing) {
      const propertiesViewed =
        propertyId && !existing.propertiesViewed.includes(propertyId)
          ? [...existing.propertiesViewed, propertyId].slice(-50)
          : existing.propertiesViewed;
      const updated = await prisma.visit.update({
        where: { sessionId },
        data: {
          lastSeenAt: new Date(),
          pageviews: { increment: 1 },
          lastPath: path ?? existing.lastPath,
          propertiesViewed,
          // Backfill user info if the visitor signed in mid-session.
          userId: session?.uid ?? existing.userId,
          userName: session?.name ?? existing.userName,
          userEmail: session?.email ?? existing.userEmail,
          // Re-stamp geo too, in case it was missing on the first beacon.
          country: country ?? existing.country,
          region: region ?? existing.region,
          city: city ?? existing.city,
          district: district ?? existing.district,
          postalCode: postalCode ?? existing.postalCode,
          lat: lat ?? existing.lat,
          lng: lng ?? existing.lng,
        },
        select: { id: true, pageviews: true, lastSeenAt: true },
      });
      return NextResponse.json({ ok: true, mode: "update", visit: updated });
    }

    const created = await prisma.visit.create({
      data: {
        sessionId,
        userId: session?.uid ?? null,
        userName: session?.name ?? null,
        userEmail: session?.email ?? null,
        ip,
        country, region, city, district, postalCode,
        lat, lng,
        userAgent,
        referrer,
        lastPath: path ?? null,
        propertiesViewed: propertyId ? [propertyId] : [],
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, mode: "create", visit: created });
  } catch (err) {
    console.error("[track/visit] failed", err);
    return NextResponse.json({ ok: false, error: "track_failed" }, { status: 500 });
  }
}

function numOrNull(s: string | null): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
