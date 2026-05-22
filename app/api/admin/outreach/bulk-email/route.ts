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

async function sendEmailToProspect(prospectId: string): Promise<{ ok: boolean; subject?: string; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/admin/outreach/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-call": "1" },
      body: JSON.stringify({ prospectId }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, subject: data.subject } : { ok: false, error: data.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function POST(req: NextRequest) {
  const { err } = await adminGuard();
  if (err) return err;

  const body = await req.json().catch(() => null);
  const { filter = "hot", limit = 10 } = body ?? {};

  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ sent: 0, failed: 0, message: "DB disabled" });
  }

  const safeLimit = Math.min(50, Math.max(1, Number(limit)));

  const where: Record<string, unknown> = { status: "pending" };
  if (filter === "hot") where.interestLabel = "hot";
  else if (filter === "warm") where.interestLabel = "warm";
  else if (filter === "cold") where.interestLabel = "cold";

  const prospects = await prisma.outreachProspect.findMany({
    where,
    orderBy: { interestScore: "desc" },
    take: safeLimit,
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const p of prospects) {
    const result = await sendEmailToProspect(p.id);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      if (result.error) errors.push(`${p.id}: ${result.error}`);
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({
    sent,
    failed,
    total: prospects.length,
    errors: errors.slice(0, 5),
  });
}
