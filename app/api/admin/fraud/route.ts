import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { scanDbForFraud } from "@/server/property/fraud";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true } });
  if (u?.role !== "ADMIN" && u?.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

/**
 * GET /api/admin/fraud  → live fraud flags from the DB catalogue.
 * Returns an empty list (not an error) when DB is disabled, so the admin
 * UI can show "Live mode off — using mock data" without erroring.
 */
export async function GET() {
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ flags: [], mode: "mock_only" });
  }
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const flags = await scanDbForFraud();
    return NextResponse.json({ flags, mode: "live", scannedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[admin/fraud] scan_failed", err);
    return NextResponse.json({ error: "scan_failed" }, { status: 500 });
  }
}
