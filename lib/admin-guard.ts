import { NextResponse } from "next/server";
import { getSession } from "./auth-server";
import { isAdminRole, isSuperAdminRole, type Session } from "./session";
import { prisma } from "@/server/db";

type GuardResult =
  | { ok: true; session: Session }
  | { ok: false; res: NextResponse };

/** Gate an /api/admin/* route for any admin role (ADMIN or SUPER_ADMIN). */
export async function requireAdmin(): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }
  if (process.env.USE_DB === "1") {
    const u = await prisma.user
      .findUnique({ where: { id: session.uid }, select: { role: true } })
      .catch(() => null);
    const role = u?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
    }
    return { ok: true, session };
  }
  if (!isAdminRole(session.role)) {
    return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}

/** Stricter gate — only SUPER_ADMIN may pass (use for destructive operations). */
export async function requireSuperAdmin(): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }
  if (process.env.USE_DB === "1") {
    const u = await prisma.user
      .findUnique({ where: { id: session.uid }, select: { role: true } })
      .catch(() => null);
    if (u?.role !== "SUPER_ADMIN") {
      return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
    }
    return { ok: true, session };
  }
  if (!isSuperAdminRole(session.role)) {
    return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}

/**
 * Returns true if the email matches the SUPER_ADMIN_EMAILS allowlist.
 * Used by the OTP/OAuth sign-in flow to auto-promote on first sign-in.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
