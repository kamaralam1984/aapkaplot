import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { store } from "@/server/in-memory-store";

const Body = z.object({
  propertyId: z.string().min(1),
});

const DAILY_QUOTA = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getSession();
  // Reveal phone requires auth — buyers must log in.
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const now = Date.now();
  const list = (store.leadReveals.get(session.uid) ?? []).filter((r) => now - r.at < DAY_MS);
  if (list.length >= DAILY_QUOTA) {
    return NextResponse.json(
      { error: "quota_exceeded", quota: DAILY_QUOTA, retryAfterHours: 24 },
      { status: 429 }
    );
  }
  list.push({ propertyId: parsed.data.propertyId, at: now });
  store.leadReveals.set(session.uid, list);

  // In production: look up the actual owner phone from DB.
  return NextResponse.json({
    ok: true,
    phoneMasked: "+91 98xxxxxx12",
    remaining: DAILY_QUOTA - list.length,
  });
}
