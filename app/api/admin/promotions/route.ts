import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";

async function adminGuard() {
  const session = await getSession();
  if (!session) return { session: null, err: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!isAdminRole(session.role)) return { session: null, err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, err: null };
}

export async function GET() {
  const { err } = await adminGuard();
  if (err) return err;

  if (process.env.USE_DB !== "1")
    return NextResponse.json({ promotions: [] });

  const now = new Date();
  const promotions = await prisma.property.findMany({
    where: { featuredUntil: { gt: now } },
    select: {
      id: true,
      title: true,
      city: true,
      priceInr: true,
      featuredUntil: true,
      promotionTag: true,
    },
    orderBy: { featuredUntil: "asc" },
  });

  return NextResponse.json({ promotions });
}

export async function POST(req: NextRequest) {
  const { err } = await adminGuard();
  if (err) return err;

  const body = await req.json().catch(() => null);
  const { propertyId, tag, days } = body ?? {};

  if (!propertyId || !tag || !days) {
    return NextResponse.json({ error: "propertyId, tag, and days are required" }, { status: 400 });
  }
  if (!["best_deal", "hot_nearby", "featured"].includes(tag)) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
  }
  if (typeof days !== "number" || days < 1 || days > 365) {
    return NextResponse.json({ error: "days must be 1–365" }, { status: 400 });
  }

  if (process.env.USE_DB !== "1")
    return NextResponse.json({ error: "DB disabled" }, { status: 503 });

  const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: { featuredUntil, promotionTag: tag },
    select: { id: true, title: true, featuredUntil: true, promotionTag: true },
  });

  return NextResponse.json({ property });
}
