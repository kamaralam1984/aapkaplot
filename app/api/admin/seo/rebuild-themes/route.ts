import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { prisma } from "@/server/db";
import { pickTemplate } from "@/lib/seo/template-router";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TEMPLATE_TO_ENUM = {
  "overview-map": "OVERVIEW_MAP",
  "buying-guide": "BUYING_GUIDE",
  "price-dashboard": "PRICE_DASHBOARD",
  "comparison": "COMPARISON",
  "investment-outlook": "INVESTMENT_OUTLOOK",
  "knowledge-faq": "KNOWLEDGE_FAQ",
} as const;

/** Re-assign the template variant for every page using the latest pickTemplate()
 *  weighting. Content unchanged — only the visual layout changes. */
export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const pages = await prisma.seoPage.findMany({ select: { id: true, slug: true, template: true } });
  let changed = 0;
  for (const p of pages) {
    const variant = pickTemplate(p.slug);
    const want = TEMPLATE_TO_ENUM[variant];
    if (p.template !== want) {
      await prisma.seoPage.update({ where: { id: p.id }, data: { template: want } });
      changed++;
    }
  }
  return NextResponse.json({ ok: true, scanned: pages.length, changed });
}
