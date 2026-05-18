import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/** Wipe every REJECTED row. Super-admin only (destructive). */
export async function POST() {
  const auth = await requireAdmin({ superOnly: true });
  if ("error" in auth) return auth.error;

  const out = await prisma.seoPage.deleteMany({ where: { status: "REJECTED" } });
  return NextResponse.json({ ok: true, deleted: out.count });
}
