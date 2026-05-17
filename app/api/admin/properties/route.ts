import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

const ListQuery = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "SOLD", "REJECTED"]).optional(),
  kind: z.enum(["PLOT", "FLAT", "HOUSE", "VILLA", "SHOP", "OFFICE"]).optional(),
  intent: z.enum(["BUY", "RENT", "SELL"]).optional(),
  city: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const parsed = ListQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { status, kind, intent, city, q, page, pageSize } = parsed.data;

  const where: Prisma.PropertyWhereInput = {
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
    ...(intent ? { intent } : {}),
    ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { locality: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" } as Prisma.PropertyOrderByWithRelationInput,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        title: true,
        kind: true,
        intent: true,
        status: true,
        priceInr: true,
        areaSqft: true,
        city: true,
        locality: true,
        verified: true,
        trustScore: true,
        coverUrl: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, rows });
}

const CreateBody = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(4000).optional(),
  kind: z.enum(["PLOT", "FLAT", "HOUSE", "VILLA", "SHOP", "OFFICE"]),
  intent: z.enum(["BUY", "RENT", "SELL"]),
  priceInr: z.number().int().positive(),
  areaSqft: z.number().int().positive(),
  bhk: z.number().int().min(0).max(20).optional(),
  city: z.string().min(1).max(60),
  locality: z.string().min(1).max(80),
  state: z.string().min(1).max(60),
  pincode: z.string().max(10).optional(),
  lat: z.number(),
  lng: z.number(),
  coverUrl: z.string().url(),
  ownerId: z.string().min(1),
});

export async function POST(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: parsed.data.ownerId }, select: { id: true } });
  if (!owner) return NextResponse.json({ error: "owner_not_found" }, { status: 404 });

  const created = await prisma.property.create({
    data: { ...parsed.data, status: "ACTIVE", verified: true },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
