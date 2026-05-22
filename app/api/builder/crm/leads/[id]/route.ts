import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_STATUSES = ["new", "contacted", "qualified", "lost"] as const;
const Body = z.object({ status: z.enum(VALID_STATUSES) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid status" }, { status: 400 });

  const lead = await prisma.lead.findFirst({ where: { id, toUserId: session.uid } });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.lead.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
