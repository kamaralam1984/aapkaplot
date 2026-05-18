import { NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import { improveSinglePage } from "@/lib/seo/generator";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const result = await improveSinglePage(id);
  return NextResponse.json(result);
}
