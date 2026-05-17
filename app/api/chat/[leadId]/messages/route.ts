import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { publishMessage } from "@/lib/chat-bus";

export const runtime = "nodejs";

const SPAM_PATTERNS: RegExp[] = [
  /\b(?:loan|crypto|forex|bitcoin|lottery|jackpot)\b/i,
  /https?:\/\/(?!aapkaplot\.com)/i,
  /(.)\1{4,}/,
  /\b\d[\d\s\-]{8,}\d\b/,
];

function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some((re) => re.test(text));
}

async function loadLead(leadId: string, uid: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, fromUserId: true, toUserId: true, propertyId: true },
  });
  if (!lead) return null;
  if (lead.fromUserId !== uid && lead.toUserId !== uid) return "forbidden";
  return lead;
}

export async function GET(_req: Request, ctx: { params: Promise<{ leadId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") return NextResponse.json({ error: "db_disabled" }, { status: 503 });

  const { leadId } = await ctx.params;
  const lead = await loadLead(leadId, session.uid);
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (lead === "forbidden") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { leadId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, fromUserId: true, body: true, createdAt: true },
  });

  // Mark unread incoming messages as read.
  await prisma.message.updateMany({
    where: { leadId, fromUserId: { not: session.uid }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    leadId,
    messages: messages.map((m) => ({
      id: m.id,
      fromUserId: m.fromUserId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      fromMe: m.fromUserId === session.uid,
    })),
  });
}

const PostBody = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request, ctx: { params: Promise<{ leadId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") return NextResponse.json({ error: "db_disabled" }, { status: 503 });

  const { leadId } = await ctx.params;
  const lead = await loadLead(leadId, session.uid);
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (lead === "forbidden") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const text = parsed.data.body.trim();
  if (isSpam(text)) {
    return NextResponse.json({ error: "spam_blocked" }, { status: 422 });
  }

  const saved = await prisma.message.create({
    data: { leadId, fromUserId: session.uid, body: text },
    select: { id: true, leadId: true, fromUserId: true, body: true, createdAt: true },
  });

  const msg = {
    id: saved.id,
    leadId: saved.leadId,
    fromUserId: saved.fromUserId,
    body: saved.body,
    createdAt: saved.createdAt.toISOString(),
  };
  publishMessage(msg);

  return NextResponse.json({ ok: true, message: { ...msg, fromMe: true } }, { status: 201 });
}
