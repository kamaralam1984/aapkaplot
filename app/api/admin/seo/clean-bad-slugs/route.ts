import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/** Demote pages with ANY active quality flag from PUBLISHED to ARCHIVED so
 *  Google drops them. Does NOT delete the row — Audit + Delete is a separate
 *  super-admin action. Idempotent: re-running is safe. */
export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const result = await prisma.seoPage.updateMany({
    where: {
      status: "PUBLISHED",
      // Postgres array length filter
      NOT: { qualityFlags: { isEmpty: true } },
    },
    data: { status: "ARCHIVED" },
  });
  return NextResponse.json({ ok: true, archived: result.count });
}
