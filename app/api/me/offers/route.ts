import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

/**
 * GET /api/me/offers
 *
 * All offers the current user submitted (buyer-side inbox). Returns
 * latest 50 with property + seller info inline so the page renders
 * without N+1 lookups.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ offers: [], mode: "db_disabled" });
  }

  const rows = await prisma.lead.findMany({
    where: { fromUserId: session.uid, offerAmountInr: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      offerAmountInr: true,
      offerStatus: true,
      status: true,
      message: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          title: true,
          coverUrl: true,
          locality: true,
          city: true,
          priceInr: true,
        },
      },
      toUser: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    offers: rows.map((r) => ({
      id: r.id,
      offerAmountInr: r.offerAmountInr ?? 0,
      offerStatus: r.offerStatus ?? "pending",
      leadStatus: r.status,
      message: r.message,
      property: r.property,
      seller: r.toUser,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    mode: "live",
  });
}
