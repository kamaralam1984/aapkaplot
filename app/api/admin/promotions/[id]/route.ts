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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { err } = await adminGuard();
  if (err) return err;

  if (process.env.USE_DB !== "1")
    return NextResponse.json({ error: "DB disabled" }, { status: 503 });

  const { id } = await params;

  await prisma.property.update({
    where: { id },
    data: { featuredUntil: null, promotionTag: null },
  });

  return NextResponse.json({ ok: true });
}
