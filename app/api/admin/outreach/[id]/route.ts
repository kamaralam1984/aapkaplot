import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";

async function adminGuard() {
  const session = await getSession();
  if (!session) return { session: null, err: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!isAdminRole(session.role)) return { session: null, err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, err: null };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { err } = await adminGuard();
  if (err) return err;

  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "DB disabled" }, { status: 503 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { notes, status, interestScore } = body ?? {};

  const data: Record<string, unknown> = {};
  if (notes !== undefined) data.notes = notes;
  if (status !== undefined) data.status = status;
  if (interestScore !== undefined) {
    const score = Math.min(100, Math.max(0, Number(interestScore)));
    data.interestScore = score;
    data.interestLabel = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";
  }

  const prospect = await prisma.outreachProspect.update({ where: { id }, data });
  return NextResponse.json({ prospect });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { err } = await adminGuard();
  if (err) return err;

  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "DB disabled" }, { status: 503 });
  }

  const { id } = await params;
  await prisma.outreachProspect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
