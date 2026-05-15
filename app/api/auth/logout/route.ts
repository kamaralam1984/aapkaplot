import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionCookie } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  jar.delete(sessionCookie.name);
  return NextResponse.json({ ok: true });
}
