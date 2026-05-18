import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyMockOtp } from "@/lib/mock-otp-store";
import { encodeSession, newUserId, sessionCookie, type SessionRole } from "@/lib/session";
import { isSuperAdminEmail } from "@/lib/admin-guard";
import { prisma } from "@/server/db";

const Body = z.object({
  email: z.string().email(),
  code: z.string().regex(/^[0-9]{6}$/),
  role: z.enum(["buyer", "seller", "agent"]).default("buyer"),
  name: z.string().min(1).max(60).optional(),
  phone: z.string().regex(/^[6-9][0-9]{9}$/).optional(),
  address: z.string().min(6).max(240).optional(),
});

function prismaRoleToSession(role: string): SessionRole {
  switch (role) {
    case "ADMIN": return "admin";
    case "SUPER_ADMIN": return "super_admin";
    case "SELLER": return "seller";
    case "AGENT": return "agent";
    default: return "buyer";
  }
}

function sessionRoleToPrisma(role: SessionRole) {
  switch (role) {
    case "admin": return "ADMIN" as const;
    case "super_admin": return "SUPER_ADMIN" as const;
    case "seller": return "SELLER" as const;
    case "agent": return "AGENT" as const;
    default: return "BUYER" as const;
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { email, code, role, name, phone, address } = parsed.data;
  const lower = email.toLowerCase().trim();

  const result = verifyMockOtp(lower, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  let uid: string;
  let finalRole: SessionRole = role;
  let finalName: string | undefined = name;

  if (process.env.USE_DB === "1") {
    const promote = isSuperAdminEmail(lower);
    const existing = await prisma.user.findUnique({ where: { email: lower } });
    if (existing) {
      uid = existing.id;
      // Role resolution rules, in priority order:
      //   1. Super-admin allowlist always wins.
      //   2. If the user is an admin / super_admin / seller / agent already,
      //      don't downgrade based on a signup form pick.
      //   3. Otherwise (typically BUYER from a prior Google OAuth bridge or
      //      first OTP signup), honour whatever the form chose — this is
      //      what fixes "selected Seller but profile shows Buyer".
      const requestedPrisma = sessionRoleToPrisma(role);
      let targetPrisma = existing.role;
      if (promote && existing.role !== "SUPER_ADMIN") {
        targetPrisma = "SUPER_ADMIN";
      } else if (
        existing.role === "BUYER" &&
        (requestedPrisma === "SELLER" || requestedPrisma === "AGENT")
      ) {
        targetPrisma = requestedPrisma;
      }
      // Backfill any newly-collected profile fields without overwriting non-null
      // values the user already has on file.
      const updateData: Record<string, unknown> = {};
      if (targetPrisma !== existing.role) updateData.role = targetPrisma;
      if (!existing.name && name) updateData.name = name;
      if (!existing.address && address) updateData.address = address;
      // Replace the legacy "email:xxx" sentinel with a real phone when supplied.
      if (phone && existing.phone.startsWith("email:")) {
        const phoneInUse = await prisma.user.findUnique({ where: { phone } });
        if (phoneInUse && phoneInUse.id !== existing.id) {
          return NextResponse.json({ error: "phone_taken" }, { status: 409 });
        }
        updateData.phone = phone;
        updateData.phoneVerified = new Date();
      }
      if (Object.keys(updateData).length) {
        await prisma.user.update({ where: { id: uid }, data: updateData });
      }
      finalRole = prismaRoleToSession(targetPrisma);
      finalName = existing.name ?? name;
    } else {
      // New user. Use real phone if supplied; otherwise fall back to the
      // legacy email-prefixed sentinel so the unique constraint still passes.
      if (phone) {
        const phoneInUse = await prisma.user.findUnique({ where: { phone } });
        if (phoneInUse) {
          return NextResponse.json({ error: "phone_taken" }, { status: 409 });
        }
      }
      try {
        const created = await prisma.user.create({
          data: {
            phone: phone ?? `email:${lower}`,
            email: lower,
            name: name ?? null,
            address: address ?? null,
            role: promote ? "SUPER_ADMIN" : sessionRoleToPrisma(role),
            emailVerified: new Date(),
            phoneVerified: phone ? new Date() : null,
          },
        });
        uid = created.id;
        finalRole = prismaRoleToSession(created.role);
      } catch (err) {
        const msg = (err as Error).message || "";
        if (msg.includes("Unique") && msg.includes("phone")) {
          return NextResponse.json({ error: "phone_taken" }, { status: 409 });
        }
        if (msg.includes("Unique") && msg.includes("email")) {
          return NextResponse.json({ error: "email_taken" }, { status: 409 });
        }
        throw err;
      }
    }
  } else {
    uid = newUserId();
    if (isSuperAdminEmail(lower)) finalRole = "super_admin";
  }

  const session = {
    uid,
    email: lower,
    name: finalName,
    role: finalRole,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = encodeSession(session);
  const jar = await cookies();
  jar.set(sessionCookie.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });

  return NextResponse.json({ ok: true, session });
}
