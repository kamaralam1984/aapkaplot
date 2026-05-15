import { NextResponse } from "next/server";
import { z } from "zod";
import { findNearbyProperties } from "@/server/property/geo";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(20000).default(5),
  kind: z.string().optional(),
  intent: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(24),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const results = await findNearbyProperties(parsed.data);
    return NextResponse.json({ count: results.length, results });
  } catch (err) {
    console.error("[api/property/nearby]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
