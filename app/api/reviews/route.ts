import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

const PostBody = z.object({
  propertyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(4).max(2000),
});

/**
 * GET /api/reviews?propertyId=xxx
 *   → public list + aggregate (count, average).
 *
 * Returns empty list if DB is disabled — the UI will hide gracefully.
 */
export async function GET(req: Request) {
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ reviews: [], aggregate: { count: 0, average: 0 } });
  }
  const propertyId = new URL(req.url).searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: "missing_propertyId" }, { status: 400 });

  const [rows, agg] = await Promise.all([
    prisma.review.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, rating: true, body: true, createdAt: true,
        author: { select: { name: true, phone: true } },
      },
    }),
    prisma.review.aggregate({
      where: { propertyId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      authorName: r.author.name ?? maskPhone(r.author.phone),
    })),
    aggregate: {
      count: agg._count._all,
      average: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { propertyId, rating, body } = parsed.data;

  // Reject self-reviews (owner reviewing own listing).
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });
  if (!property) return NextResponse.json({ error: "property_not_found" }, { status: 404 });
  if (property.ownerId === session.uid) {
    return NextResponse.json({ error: "cannot_review_own" }, { status: 400 });
  }

  const row = await prisma.review.upsert({
    where: { propertyId_authorId: { propertyId, authorId: session.uid } },
    create: { propertyId, authorId: session.uid, subjectId: property.ownerId, rating, body },
    update: { rating, body },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

function maskPhone(phone: string) {
  if (phone.length < 4) return "Buyer";
  return `${phone.slice(0, 2)}xxxxxx${phone.slice(-2)}`;
}
