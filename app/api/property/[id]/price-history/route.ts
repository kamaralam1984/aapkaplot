import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

/**
 * GET /api/property/[id]/price-history
 *
 * Returns up to 200 price-history points for a property, oldest first.
 * Public — no auth required (everyone gets to see negotiation history).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.USE_DB !== "1") return NextResponse.json({ points: [], mode: "db_disabled" });
  const { id } = await params;

  const rows = await prisma.priceHistory.findMany({
    where: { propertyId: id },
    orderBy: { recordedAt: "asc" },
    take: 200,
    select: { priceInr: true, recordedAt: true, reason: true },
  });

  return NextResponse.json({
    points: rows.map((r) => ({
      priceInr: r.priceInr,
      at: r.recordedAt.toISOString(),
      reason: r.reason,
    })),
  });
}
