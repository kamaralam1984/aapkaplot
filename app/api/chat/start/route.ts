import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const Body = z.object({
  propertyId: z.string().min(1),
  message: z.string().max(500).optional(),
});

/**
 * Start (or resume) a chat thread between the current user and the owner
 * of a property. Returns a leadId the client uses to render /chat/[id].
 *
 * Lead is unique per (fromUserId, toUserId, propertyId) so re-clicking the
 * "Chat with owner" button never spawns duplicates.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { propertyId, message } = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true },
  });
  if (!property) {
    return NextResponse.json({ error: "property_not_found" }, { status: 404 });
  }
  if (property.ownerId === session.uid) {
    return NextResponse.json({ error: "cannot_chat_self" }, { status: 400 });
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
      via: "chat",
    },
    update: {},
    select: { id: true, createdAt: true },
  });

  if (message?.trim()) {
    await prisma.message.create({
      data: { leadId: lead.id, fromUserId: session.uid, body: message.trim() },
    });
  }

  return NextResponse.json({ ok: true, leadId: lead.id, createdAt: lead.createdAt });
}
