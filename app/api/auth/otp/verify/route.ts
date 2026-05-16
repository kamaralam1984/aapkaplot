import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyMockOtp } from "@/lib/mock-otp-store";
import { encodeSession, newUserId, sessionCookie, type SessionRole } from "@/lib/session";

const Body = z.object({
  email: z.string().email(),
  code: z.string().regex(/^[0-9]{6}$/),
  role: z.enum(["buyer", "seller", "agent"]).default("buyer"),
  name: z.string().min(1).max(60).optional(),
});

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

  const session = {
    uid: newUserId(),
    email: lower,
    name,
    role: role as SessionRole,
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
