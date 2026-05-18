import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

/**
 * POST /api/lead/offer/action
 *
 * Accept / decline / counter an offer (seller side) OR withdraw an offer
 * (buyer side). Single endpoint so every action is auth-gated and audited
 * the same way.
 *
 * Body: { leadId, action, counterAmountInr?, note? }
 *   action ∈ accept | decline | counter | withdraw
 *
 * Auth rules:
 *   accept  / decline / counter  → only Lead.toUserId (the seller).
 *   withdraw                     → only Lead.fromUserId (the buyer).
 */
const Body = z.discriminatedUnion("action", [
  z.object({ leadId: z.string().min(1), action: z.literal("accept"),  note: z.string().max(280).optional() }),
  z.object({ leadId: z.string().min(1), action: z.literal("decline"), note: z.string().max(280).optional() }),
  z.object({
    leadId: z.string().min(1),
    action: z.literal("counter"),
    counterAmountInr: z.number().int().min(1000).max(10_000_000_000),
    note: z.string().max(280).optional(),
  }),
  z.object({ leadId: z.string().min(1), action: z.literal("withdraw") }),
]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { leadId, action } = parsed.data;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true, fromUserId: true, toUserId: true, propertyId: true,
      offerAmountInr: true, offerStatus: true,
      property: { select: { title: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Authorise based on action.
  const isSeller = lead.toUserId === session.uid;
  const isBuyer = lead.fromUserId === session.uid;
  if ((action === "accept" || action === "decline" || action === "counter") && !isSeller) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (action === "withdraw" && !isBuyer) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updateData: {
    offerStatus: "accepted" | "declined" | "countered" | "withdrawn";
    offerAmountInr?: number;
    status?: string;
  } = { offerStatus: mapStatus(action) };

  if (action === "counter") {
    updateData.offerAmountInr = parsed.data.counterAmountInr;
  }
  if (action === "accept") {
    updateData.status = "qualified";
  } else if (action === "decline" || action === "withdraw") {
    updateData.status = "lost";
  }

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
    select: { id: true, offerStatus: true, offerAmountInr: true, status: true },
  });

  // Drop a system message into the chat so both parties see what happened.
  const noteText =
    action === "accept"
      ? `Offer accepted${parsed.data.note ? `: ${parsed.data.note}` : ""}.`
      : action === "decline"
      ? `Offer declined${parsed.data.note ? `: ${parsed.data.note}` : ""}.`
      : action === "counter"
      ? `Seller countered with ₹${parsed.data.counterAmountInr.toLocaleString("en-IN")}${parsed.data.note ? ` — ${parsed.data.note}` : ""}.`
      : `Buyer withdrew the offer.`;
  await prisma.message.create({
    data: {
      leadId,
      fromUserId: session.uid,
      body: noteText,
    },
  }).catch(() => {});

  // Notify the other party.
  const notifyUserId = isSeller ? lead.fromUserId : lead.toUserId;
  sendPushToUser(notifyUserId, {
    title:
      action === "accept"  ? `Offer accepted on "${lead.property?.title ?? "your listing"}"`  :
      action === "decline" ? `Offer declined on "${lead.property?.title ?? "your listing"}"` :
      action === "counter" ? `Seller countered with ₹${parsed.data.counterAmountInr.toLocaleString("en-IN")}` :
                              `Buyer withdrew their offer`,
    body: noteText,
    url: isSeller ? `/me/offers` : `/sell/leads`,
    tag: `offer-action-${leadId}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, lead: updated });
}

function mapStatus(action: "accept" | "decline" | "counter" | "withdraw"): "accepted" | "declined" | "countered" | "withdrawn" {
  switch (action) {
    case "accept":   return "accepted";
    case "decline":  return "declined";
    case "counter":  return "countered";
    case "withdraw": return "withdrawn";
  }
}
