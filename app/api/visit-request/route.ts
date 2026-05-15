import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/server/in-memory-store";

const Body = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2).max(60),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  scheduledFor: z.string().datetime().optional(),
  slot: z.string().min(1).max(20),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const id = `vr_${Math.random().toString(36).slice(2, 10)}`;
  const record = {
    id,
    propertyId: parsed.data.propertyId,
    slot: parsed.data.slot,
    status: "pending" as const,
    scheduledFor: parsed.data.scheduledFor ?? new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  store.visitRequests.set(id, record);
  return NextResponse.json({ ok: true, visit: record });
}

export async function GET() {
  return NextResponse.json({ visits: [...store.visitRequests.values()] });
}
