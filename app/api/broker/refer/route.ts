import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { expectedCommission } from "@/lib/broker";

export const runtime = "nodejs";

const Body = z.object({
  propertyId: z.string().min(1),
  buyerPhone: z.string().regex(/^\+?[0-9]{10,15}$/),
  buyerName: z.string().min(2).max(80).optional(),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/broker/refer
 *   Broker introduces a buyer to a property. We:
 *     1. Find or create the buyer User by phone.
 *     2. Snapshot the commission % at refer-time.
 *     3. Upsert a BrokerReferral linking broker + buyer + property.
 *
 *   The matching Lead is created later (when the buyer messages / makes an
 *   offer). On offer-accept, we look up the matching referral and create a
 *   Commission row — see /api/seller/leads PATCH.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") return NextResponse.json({ error: "db_disabled" }, { status: 503 });

  const profile = await prisma.brokerProfile.findUnique({ where: { userId: session.uid } });
  if (!profile) return NextResponse.json({ error: "no_broker_profile" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { propertyId, buyerPhone, buyerName, note } = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, priceInr: true, allowsBrokers: true, brokerCommissionPct: true, title: true },
  });
  if (!property) return NextResponse.json({ error: "property_not_found" }, { status: 404 });
  if (!property.allowsBrokers) {
    return NextResponse.json({ error: "property_not_open_to_brokers" }, { status: 403 });
  }
  if (property.ownerId === session.uid) {
    return NextResponse.json({ error: "cannot_refer_own" }, { status: 400 });
  }

  // Find or create buyer by phone.
  const buyer = await prisma.user.upsert({
    where: { phone: buyerPhone },
    create: { phone: buyerPhone, name: buyerName ?? null, role: "BUYER" },
    update: { name: buyerName ?? undefined },
    select: { id: true },
  });
  if (buyer.id === session.uid) {
    return NextResponse.json({ error: "cannot_refer_self" }, { status: 400 });
  }

  const commissionPct = property.brokerCommissionPct ?? profile.defaultCommissionPct;
  const expectedAmount = expectedCommission(property.priceInr, commissionPct);

  const referral = await prisma.brokerReferral.upsert({
    where: {
      brokerId_buyerId_propertyId: {
        brokerId: session.uid,
        buyerId: buyer.id,
        propertyId,
      },
    },
    create: {
      brokerId: session.uid,
      buyerId: buyer.id,
      propertyId,
      commissionPct,
      expectedCommissionInr: expectedAmount,
      note: note ?? null,
      status: "pending",
    },
    update: {
      commissionPct,
      expectedCommissionInr: expectedAmount,
      note: note ?? undefined,
    },
    select: { id: true, status: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    referralId: referral.id,
    status: referral.status,
    commissionPct,
    expectedCommissionInr: expectedAmount,
  }, { status: 201 });
}

/**
 * GET /api/broker/refer — list referrals owned by the current broker.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") return NextResponse.json({ referrals: [], mode: "db_disabled" });

  const rows = await prisma.brokerReferral.findMany({
    where: { brokerId: session.uid },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      buyer:    { select: { name: true, phone: true } },
      property: { select: { id: true, title: true, coverUrl: true, priceInr: true, city: true, locality: true } },
    },
  });
  return NextResponse.json({
    mode: "live",
    referrals: rows.map((r) => ({
      id: r.id,
      status: r.status,
      commissionPct: r.commissionPct,
      expectedCommissionInr: r.expectedCommissionInr,
      createdAt: r.createdAt.toISOString(),
      buyer: { name: r.buyer.name ?? r.buyer.phone, phone: r.buyer.phone },
      property: r.property,
    })),
  });
}
