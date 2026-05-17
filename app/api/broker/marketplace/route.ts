import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

/**
 * GET /api/broker/marketplace
 *   Lists ACTIVE properties whose owner has opted in to broker referrals.
 *   Only callable by users with a BrokerProfile.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ properties: [], mode: "db_disabled" });
  }

  const profile = await prisma.brokerProfile.findUnique({ where: { userId: session.uid } });
  if (!profile) {
    return NextResponse.json({ error: "no_broker_profile" }, { status: 403 });
  }

  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const kind = url.searchParams.get("kind");

  const rows = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      allowsBrokers: true,
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(kind ? { kind: kind.toUpperCase() as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, title: true, kind: true, intent: true,
      priceInr: true, areaSqft: true, bhk: true,
      locality: true, city: true, state: true,
      coverUrl: true, brokerCommissionPct: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    mode: "live",
    defaultCommissionPct: profile.defaultCommissionPct,
    properties: rows.map((p) => ({
      ...p,
      effectiveCommissionPct: p.brokerCommissionPct ?? profile.defaultCommissionPct,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
