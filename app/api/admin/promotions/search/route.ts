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

export async function GET(req: NextRequest) {
  const { err } = await adminGuard();
  if (err) return err;

  if (process.env.USE_DB !== "1")
    return NextResponse.json({ properties: [] });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const properties = await prisma.property.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    select: {
      id: true,
      title: true,
      city: true,
      locality: true,
      priceInr: true,
      status: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ properties });
}
