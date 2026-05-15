import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/server/in-memory-store";

const Body = z.object({
  name: z.string().min(1).max(60),
  props: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  store.events.push({
    name: parsed.data.name,
    props: parsed.data.props ?? {},
    at: Date.now(),
  });
  // Trim oldest if we drift past 5,000 events.
  if (store.events.length > 5_000) store.events.splice(0, store.events.length - 5_000);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Dev convenience — surface last 50.
  return NextResponse.json({ events: store.events.slice(-50).reverse() });
}
