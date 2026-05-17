import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });
const unauth = () => NextResponse.json({ error: "unauthenticated" }, { status: 401 });

const Body = z.object({ propertyId: z.string().min(1) });

export async function GET() {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const rows = await prisma.favorite.findMany({
    where: { userId: session.uid },
    orderBy: { createdAt: "desc" },
    select: { propertyId: true, createdAt: true },
  });
  return NextResponse.json({
    ids: rows.map((r) => r.propertyId),
    items: rows.map((r) => ({ propertyId: r.propertyId, createdAt: r.createdAt.toISOString() })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  await prisma.favorite.upsert({
    where: {
      userId_propertyId: { userId: session.uid, propertyId: parsed.data.propertyId },
    },
    create: { userId: session.uid, propertyId: parsed.data.propertyId },
    update: {},
  });

  return NextResponse.json({ ok: true, saved: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: "missing_propertyId" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: session.uid, propertyId },
  });

  return NextResponse.json({ ok: true, saved: false });
}
