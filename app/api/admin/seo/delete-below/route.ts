import { NextResponse } from "next/server";
import { SeoStatus } from "@prisma/client";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Delete pages with qualityScore < threshold.
 *
 * Query params:
 *   threshold=<0-100>           required
 *   includeIndexable=1          also wipe PUBLISHED pages below threshold
 *                               (otherwise only PENDING/REJECTED/ARCHIVED)
 */
export async function POST(req: Request) {
  const auth = await requireAdmin({ superOnly: true });
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const threshold = Math.max(0, Math.min(100, Number(url.searchParams.get("threshold")) || 40));
  const includeIndexable = url.searchParams.get("includeIndexable") === "1";

  const statusFilter = includeIndexable
    ? undefined
    : { in: [SeoStatus.PENDING, SeoStatus.REJECTED, SeoStatus.ARCHIVED] };

  const out = await prisma.seoPage.deleteMany({
    where: {
      qualityScore: { lt: threshold },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
  });
  return NextResponse.json({ ok: true, deleted: out.count, threshold, includeIndexable });
}
