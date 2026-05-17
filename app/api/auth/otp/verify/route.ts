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
  const { email, code, role, name } = parsed.data;
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
      const targetPrisma = promote && existing.role !== "SUPER_ADMIN" ? "SUPER_ADMIN" : existing.role;
      if (targetPrisma !== existing.role) {
        await prisma.user.update({ where: { id: uid }, data: { role: targetPrisma } });
      }
      finalRole = prismaRoleToSession(targetPrisma);
      finalName = existing.name ?? name;
    } else {
      const created = await prisma.user.create({
        data: {
          phone: `email:${lower}`,
          email: lower,
          name: name ?? null,
          role: promote ? "SUPER_ADMIN" : sessionRoleToPrisma(role),
          emailVerified: new Date(),
        },
      });
      uid = created.id;
      finalRole = prismaRoleToSession(created.role);
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
