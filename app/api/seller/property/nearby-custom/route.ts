import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const EntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  category: z.enum([
    "railway", "airport", "hospital", "school", "college",
    "mall", "supermarket", "restaurant", "bank", "atm",
    "police", "fuel", "park", "tourism", "historical",
    "bus_stop", "place_of_worship", "market",
    "water_park", "gym", "other",
  ]),
  distanceKm: z.number().min(0).max(100),
});

const Body = z.object({
  propertyId: z.string(),
  entries: z.array(EntrySchema).max(30),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { propertyId, entries } = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });

  if (!property) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (property.ownerId !== session.uid && session.role !== "super_admin" && session.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: { nearbyCustom: entries },
  });

  return NextResponse.json({ ok: true });
}
