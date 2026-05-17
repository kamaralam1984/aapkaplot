import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

const Body = z.object({
  propertyId: z.string().min(1),
  offerAmountInr: z.number().int().min(1000).max(10_000_000_000),
  message: z.string().max(500).optional(),
});

/**
 * POST /api/lead/offer
 *   Submit (or update) an offer for a property. Creates/updates a Lead row
 *   with offerAmountInr + offerStatus="pending" and fires a push notification
 *   to the seller if they're opted in.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { propertyId, offerAmountInr, message } = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, title: true, priceInr: true },
  });
  if (!property) return NextResponse.json({ error: "property_not_found" }, { status: 404 });
  if (property.ownerId === session.uid) {
    return NextResponse.json({ error: "cannot_offer_own" }, { status: 400 });
  }

  const lead = await prisma.lead.upsert({
    where: {
      fromUserId_toUserId_propertyId: {
        fromUserId: session.uid,
        toUserId: property.ownerId,
        propertyId,
      },
    },
    create: {
      fromUserId: session.uid,
      toUserId: property.ownerId,
      propertyId,
      message: message ?? null,
      via: "offer",
      offerAmountInr,
      offerStatus: "pending",
      status: "new",
    },
    update: {
      offerAmountInr,
      offerStatus: "pending",
      message: message ?? undefined,
    },
    select: { id: true },
  });

  // Best-effort push to the seller — no-op if VAPID isn't configured.
  sendPushToUser(property.ownerId, {
    title: `New offer on "${property.title}"`,
    body: `Buyer offered ₹${offerAmountInr.toLocaleString("en-IN")} — open to review.`,
    url: `/sell/leads`,
    tag: `offer-${lead.id}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
}
