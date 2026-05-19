import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { encodeSession, newUserId, sessionCookie, type SessionRole } from "@/lib/session";
import { getFirebaseAdminAuth, isFirebaseAdminEnabled } from "@/server/firebase-admin";
import { prisma } from "@/server/db";

const Body = z.object({
  idToken: z.string().min(20),
  role: z.enum(["buyer", "seller", "agent"]).default("buyer"),
  name: z.string().min(1).max(60).optional(),
});

function sessionRoleToPrisma(role: SessionRole) {
  switch (role) {
    case "seller": return "SELLER" as const;
    case "agent":  return "AGENT" as const;
    case "admin":  return "ADMIN" as const;
    case "super_admin": return "SUPER_ADMIN" as const;
    default: return "BUYER" as const;
  }
}

function prismaRoleToSession(role: string): SessionRole {
  switch (role) {
    case "SELLER": return "seller";
    case "AGENT": return "agent";
    case "ADMIN": return "admin";
    case "SUPER_ADMIN": return "super_admin";
    default: return "buyer";
  }
}

// Strip the leading + and country code so we store the same `9876543210`
// shape the email-OTP path uses — keeps the unique constraint coherent.
function normalizePhone(e164: string): string | null {
  const digits = e164.replace(/[^\d]/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91")) {
    const ten = digits.slice(2);
    return /^[6-9]/.test(ten) ? ten : null;
  }
  return null;
}

export async function POST(req: Request) {
  if (!isFirebaseAdminEnabled()) {
    return NextResponse.json(
      { error: "firebase_not_configured", hint: "Set FIREBASE_ADMIN_* env vars on the server." },
      { status: 503 },
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { idToken, role, name } = parsed.data;

  const adminAuth = getFirebaseAdminAuth()!;
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  if (decoded.firebase?.sign_in_provider !== "phone" || !decoded.phone_number) {
    return NextResponse.json({ error: "not_phone_auth" }, { status: 400 });
  }

  const phone = normalizePhone(decoded.phone_number);
  if (!phone) {
    return NextResponse.json({ error: "invalid_phone_format" }, { status: 400 });
  }

  let uid: string;
  let finalRole: SessionRole = role;
  let finalName: string | undefined = name;
  let email: string | undefined;

  if (process.env.USE_DB === "1") {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      uid = existing.id;
      const requestedPrisma = sessionRoleToPrisma(role);
      let targetPrisma = existing.role;
      if (
        existing.role === "BUYER" &&
        (requestedPrisma === "SELLER" || requestedPrisma === "AGENT")
      ) {
        targetPrisma = requestedPrisma;
      }
      const updateData: Record<string, unknown> = {};
      if (targetPrisma !== existing.role) updateData.role = targetPrisma;
      if (!existing.name && name) updateData.name = name;
      if (!existing.phoneVerified) updateData.phoneVerified = new Date();
      if (Object.keys(updateData).length) {
        await prisma.user.update({ where: { id: uid }, data: updateData });
      }
      finalRole = prismaRoleToSession(targetPrisma);
      finalName = existing.name ?? name;
      email = existing.email ?? undefined;
    } else {
      try {
        const created = await prisma.user.create({
          data: {
            phone,
            name: name ?? null,
            role: sessionRoleToPrisma(role),
            phoneVerified: new Date(),
          },
        });
        uid = created.id;
        finalRole = prismaRoleToSession(created.role);
      } catch (err) {
        const msg = (err as Error).message || "";
        if (msg.includes("Unique") && msg.includes("phone")) {
          return NextResponse.json({ error: "phone_taken" }, { status: 409 });
        }
        return NextResponse.json({ error: "user_create_failed" }, { status: 500 });
      }
    }
  } else {
    uid = newUserId();
  }

  const sessionToken = encodeSession({
    uid,
    email,
    name: finalName,
    role: finalRole,
    iat: Math.floor(Date.now() / 1000),
  });

  const jar = await cookies();
  jar.set(sessionCookie.name, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });

  return NextResponse.json({ ok: true, role: finalRole });
}
