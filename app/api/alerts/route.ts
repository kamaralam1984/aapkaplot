import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });
const unauth = () => NextResponse.json({ error: "unauthenticated" }, { status: 401 });

const Frequency = z.enum(["instant", "daily", "weekly"]);

const FilterQuery = z.object({
  intent: z.enum(["buy", "rent", "sell", "all"]).optional(),
  kind: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  bhk: z.number().int().min(0).optional(),
  radiusKm: z.number().min(0).max(500).optional(),
  origin: z.object({ lat: z.number(), lng: z.number() }).optional(),
  amenities: z.array(z.string()).optional(),
  text: z.string().optional(),
}).passthrough();

const CreateBody = z.object({
  label: z.string().min(2).max(80),
  query: FilterQuery,
  frequency: Frequency.optional().default("daily"),
});

const PatchBody = z.object({
  id: z.string().min(1),
  label: z.string().min(2).max(80).optional(),
  query: FilterQuery.optional(),
  frequency: Frequency.optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const rows = await prisma.savedSearch.findMany({
    where: { userId: session.uid },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    alerts: rows.map((r) => ({
      id: r.id,
      label: r.label,
      query: r.query,
      frequency: r.frequency,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      lastSentAt: r.lastSentAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const row = await prisma.savedSearch.create({
    data: {
      userId: session.uid,
      label: parsed.data.label,
      query: parsed.data.query as Prisma.InputJsonValue,
      frequency: parsed.data.frequency,
      active: true,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, id: row.id, createdAt: row.createdAt.toISOString() }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { id, ...rest } = parsed.data;

  const result = await prisma.savedSearch.updateMany({
    where: { id, userId: session.uid },
    data: {
      ...(rest.label !== undefined && { label: rest.label }),
      ...(rest.frequency !== undefined && { frequency: rest.frequency }),
      ...(rest.active !== undefined && { active: rest.active }),
      ...(rest.query !== undefined && { query: rest.query as Prisma.InputJsonValue }),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const result = await prisma.savedSearch.deleteMany({
    where: { id, userId: session.uid },
  });
  if (result.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
