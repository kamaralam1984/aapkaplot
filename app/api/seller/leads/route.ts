import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

/**
 * GET /api/seller/leads
 *   Returns leads received by the current user (seller side of the lead).
 *   Each row carries enough property + buyer info to render the inbox card
 *   without N+1 lookups.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ leads: [], mode: "db_disabled" });
  }

  const rows = await prisma.lead.findMany({
    where: { toUserId: session.uid },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      via: true,
      message: true,
      status: true,
      offerAmountInr: true,
      offerStatus: true,
      createdAt: true,
      updatedAt: true,
      property: { select: { id: true, title: true, coverUrl: true, priceInr: true, locality: true, city: true } },
      fromUser: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  return NextResponse.json({
    mode: "live",
    leads: rows.map((r) => ({
      id: r.id,
      via: r.via ?? "chat",
      status: r.status,
      message: r.message ?? "",
      offerAmountInr: r.offerAmountInr,
      offerStatus: r.offerStatus,
      createdAt: r.createdAt.toISOString(),
      property: r.property,
      buyer: {
        id: r.fromUser.id,
        name: r.fromUser.name ?? r.fromUser.phone ?? "Buyer",
        phone: r.fromUser.phone,
        email: r.fromUser.email,
      },
    })),
  });
}

const PatchBody = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "contacted", "qualified", "lost"]).optional(),
  offerStatus: z.enum(["pending", "accepted", "declined", "countered", "withdrawn"]).optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") return NextResponse.json({ error: "db_disabled" }, { status: 503 });

  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const { id, status, offerStatus } = parsed.data;

  const lead = await prisma.lead.findFirst({
    where: { id, toUserId: session.uid },
    select: { id: true, fromUserId: true, propertyId: true, offerStatus: true },
  });
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(status !== undefined && { status }),
      ...(offerStatus !== undefined && { offerStatus }),
    },
  });

  // Broker commission hook: when an offer flips to "accepted" for the
  // first time, look up a matching referral and create a pending Commission.
  let commissionCreated: { amountInr: number } | null = null;
  if (offerStatus === "accepted" && lead.offerStatus !== "accepted") {
    const referral = await prisma.brokerReferral.findUnique({
      where: {
        brokerId_buyerId_propertyId: {
          brokerId: "__placeholder__",
          buyerId: lead.fromUserId,
          propertyId: lead.propertyId,
        },
      },
    }).catch(() => null);
    // The composite-unique lookup above only matches when broker is known. We
    // don't know the broker upfront, so do a generic findFirst by buyer+property.
    const ref = referral ?? await prisma.brokerReferral.findFirst({
      where: { buyerId: lead.fromUserId, propertyId: lead.propertyId },
      orderBy: { createdAt: "desc" },
    });

    if (ref) {
      const [created] = await prisma.$transaction([
        prisma.commission.create({
          data: {
            brokerId: ref.brokerId,
            referralId: ref.id,
            amountInr: ref.expectedCommissionInr,
            status: "pending",
            note: "Auto-created on offer accept",
          },
          select: { amountInr: true },
        }),
        prisma.brokerReferral.update({
          where: { id: ref.id },
          data: { status: "offer_accepted", leadId: lead.id },
        }),
      ]);
      commissionCreated = created;
    }
  }

  return NextResponse.json({ ok: true, commissionCreated });
}
