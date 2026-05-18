import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getSession } from "@/lib/auth-server";
import { haversineKm } from "@/lib/haversine";

export const runtime = "nodejs";

/**
 * GET /api/ai/recommendations
 *
 * Picks up to 12 ACTIVE listings the signed-in user might like, based on:
 *  • Localities they've favourited before (strongest signal).
 *  • Average price band of their saved listings (± 30 %).
 *  • Cities of properties they've visited (Visit table).
 *  • Falls back to "verified, near city centre" if no signals.
 *
 * MVP — heuristic, no ML. Sorts by a hand-tuned score.
 */
export async function GET() {
  if (process.env.USE_DB !== "1") return NextResponse.json({ items: [], mode: "db_disabled" });
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [], mode: "anonymous" });

  // 1. Pull user signals.
  const [favProps, visits] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.uid },
      select: { property: { select: { locality: true, city: true, priceInr: true, kind: true } } },
      take: 40,
    }),
    prisma.visit.findMany({
      where: { userId: session.uid },
      orderBy: { lastSeenAt: "desc" },
      take: 10,
      select: { propertiesViewed: true, city: true },
    }),
  ]);

  const favLocalities = new Set(favProps.map((f) => f.property.locality.toLowerCase()));
  const favCities = new Set(favProps.map((f) => f.property.city.toLowerCase()));
  const favKinds = new Set(favProps.map((f) => f.property.kind));
  const visitCities = new Set(visits.map((v) => v.city?.toLowerCase()).filter(Boolean) as string[]);
  const viewedIds = new Set(visits.flatMap((v) => v.propertiesViewed));

  const avgPrice =
    favProps.length > 0
      ? favProps.reduce((acc, f) => acc + f.property.priceInr, 0) / favProps.length
      : 0;
  const priceBand = avgPrice > 0
    ? { min: Math.round(avgPrice * 0.7), max: Math.round(avgPrice * 1.3) }
    : null;

  // 2. Candidate pool — ACTIVE properties, optionally narrowed to fav cities.
  const candidates = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: [...viewedIds].slice(0, 100) }, // skip what they've already seen
      ...(favCities.size > 0
        ? { city: { in: [...favCities, ...visitCities], mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, title: true, coverUrl: true, kind: true, intent: true,
      priceInr: true, areaSqft: true, locality: true, city: true,
      verified: true, trustScore: true, lat: true, lng: true, bhk: true,
      createdAt: true,
    },
  });

  // 3. Score each candidate.
  const scored = candidates.map((p) => {
    let score = 0;
    if (favLocalities.has(p.locality.toLowerCase())) score += 5;
    if (favCities.has(p.city.toLowerCase())) score += 2;
    if (favKinds.has(p.kind)) score += 2;
    if (p.verified) score += 1;
    score += Math.min(2, p.trustScore / 50);
    if (priceBand && p.priceInr >= priceBand.min && p.priceInr <= priceBand.max) score += 3;
    // Freshness — bonus if listed in the last 14 days.
    const ageDays = (Date.now() - p.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    if (ageDays < 14) score += 1;
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 12).map(({ p, score }) => ({
    id: p.id,
    title: p.title,
    coverUrl: p.coverUrl,
    kind: p.kind,
    intent: p.intent,
    priceInr: p.priceInr,
    areaSqft: p.areaSqft,
    bhk: p.bhk,
    locality: p.locality,
    city: p.city,
    verified: p.verified,
    score,
  }));

  return NextResponse.json({
    items: top,
    mode: "live",
    basis: {
      favLocalities: favLocalities.size,
      favCities: favCities.size,
      avgPrice: avgPrice || null,
      visitedCities: visitCities.size,
    },
  });
}
