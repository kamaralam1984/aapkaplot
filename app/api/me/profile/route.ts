import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { encodeSession, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

/**
 * GET /api/me/profile — returns the current user's editable profile fields.
 */
export async function GET() {
  if (process.env.USE_DB !== "1") return dbOff();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true, name: true, email: true, phone: true, address: true,
      whatsappPhone: true,
      role: true,
      phoneVerified: true, emailVerified: true,
      createdAt: true,
    },
  });
  if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Strip the `email:xxx` sentinel that pre-phone-signup rows carry —
  // surface as null so the UI shows "Add your phone".
  const phone = u.phone?.startsWith("email:") ? null : u.phone;
  return NextResponse.json({
    id: u.id,
    name: u.name,
    email: u.email,
    phone,
    address: u.address,
    whatsappPhone: u.whatsappPhone,
    role: u.role,
  });
}

/**
 * PATCH /api/me/profile — update name, phone, WhatsApp phone, address.
 * Phone changes also refresh the signed session cookie so the chip in the
 * navbar reflects the new value without a re-login.
 */
const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const Body = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z.string().regex(PHONE_REGEX, "Invalid Indian mobile").optional(),
  whatsappPhone: z.string().regex(PHONE_REGEX, "Invalid Indian mobile").optional().or(z.literal("")),
  address: z.string().max(240).optional(),
  // Self-serve role switch — buyer → seller/agent and back. ADMIN /
  // SUPER_ADMIN are server-side only; we ignore those values silently
  // rather than 400 so the form can post a single shared payload.
  role: z.enum(["buyer", "seller", "agent"]).optional(),
});

export async function PATCH(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { name, phone, whatsappPhone, address, role } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (name !== undefined)    updates.name = name.trim();
  if (address !== undefined) updates.address = address.trim();
  if (whatsappPhone !== undefined) updates.whatsappPhone = whatsappPhone === "" ? null : whatsappPhone;

  // Role switch — only honour for non-admin users so we can't accidentally
  // demote a real admin via a profile PATCH.
  if (role) {
    const me = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true } });
    if (me && me.role !== "ADMIN" && me.role !== "SUPER_ADMIN") {
      const target = role === "buyer" ? "BUYER" : role === "seller" ? "SELLER" : "AGENT";
      if (target !== me.role) updates.role = target;
    }
  }

  // Phone is unique — verify no one else has it.
  if (phone !== undefined) {
    const taken = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (taken && taken.id !== session.uid) {
      return NextResponse.json({ error: "phone_taken" }, { status: 409 });
    }
    updates.phone = phone;
    updates.phoneVerified = new Date();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.uid },
      data: updates,
      select: { id: true, name: true, phone: true, email: true, role: true, address: true, whatsappPhone: true },
    });

    // Refresh the signed session cookie so navbar / nav greetings reflect
    // new name/phone/role without a full re-login.
    if (name !== undefined || phone !== undefined || updates.role !== undefined) {
      const roleFromPrisma = (() => {
        switch (updated.role) {
          case "ADMIN": return "admin";
          case "SUPER_ADMIN": return "super_admin";
          case "SELLER": return "seller";
          case "AGENT": return "agent";
          default: return "buyer";
        }
      })();
      const token = encodeSession({
        ...session,
        name: updated.name ?? session.name,
        role: roleFromPrisma,
        // session.phone may not be on the type — guard via spread above.
        iat: Math.floor(Date.now() / 1000),
      });
      const jar = await cookies();
      jar.set(sessionCookie.name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: sessionCookie.maxAge,
      });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("[me/profile] update_failed", err);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
