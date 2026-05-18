import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole, isSuperAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";

/** Shared admin gate for /api/admin/seo/* routes. */
export async function requireAdmin(opts?: { superOnly?: boolean }) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  // Prefer the live DB role when available, fall back to the cookie role.
  let role: string | undefined;
  if (process.env.USE_DB === "1") {
    const u = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true } }).catch(() => null);
    role = u?.role?.toLowerCase();
  }
  role ??= session.role;

  if (opts?.superOnly) {
    if (!isSuperAdminRole(role as Parameters<typeof isSuperAdminRole>[0])) {
      return { error: NextResponse.json({ error: "forbidden — super admin only" }, { status: 403 }) };
    }
  } else if (!isAdminRole(role as Parameters<typeof isAdminRole>[0])) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { session, role };
}
