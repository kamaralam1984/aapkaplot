import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

/**
 * GET /api/broker/commissions
 *   Returns the broker's commission history + 3 running totals
 *   (pending, approved, paid).
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ commissions: [], totals: { pending: 0, approved: 0, paid: 0 }, mode: "db_disabled" });
  }

  const [rows, agg] = await Promise.all([
    prisma.commission.findMany({
      where: { brokerId: session.uid },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        referral: {
          include: {
            property: { select: { id: true, title: true, coverUrl: true, city: true } },
            buyer:    { select: { name: true, phone: true } },
          },
        },
      },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { brokerId: session.uid },
      _sum: { amountInr: true },
    }),
  ]);

  const totals = { pending: 0, approved: 0, paid: 0 };
  for (const a of agg) {
    if (a.status === "pending")  totals.pending  = a._sum.amountInr ?? 0;
    if (a.status === "approved") totals.approved = a._sum.amountInr ?? 0;
    if (a.status === "paid")     totals.paid     = a._sum.amountInr ?? 0;
  }

  return NextResponse.json({
    mode: "live",
    totals,
    commissions: rows.map((c) => ({
      id: c.id,
      amountInr: c.amountInr,
      status: c.status,
      note: c.note,
      paidAt: c.paidAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      property: c.referral.property,
      buyer: { name: c.referral.buyer.name ?? c.referral.buyer.phone, phone: c.referral.buyer.phone },
    })),
  });
}
