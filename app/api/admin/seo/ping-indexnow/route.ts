import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/seo/indexnow";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

const KEY_PAGES = [
  `${BASE}/`,
  `${BASE}/properties`,
  `${BASE}/search`,
  `${BASE}/pricing`,
  `${BASE}/about`,
  `${BASE}/contact`,
  `${BASE}/sell`,
  `${BASE}/blog`,
  `${BASE}/in/patna`,
  `${BASE}/in/ranchi`,
  `${BASE}/in/delhi`,
  `${BASE}/in/mumbai`,
  `${BASE}/in/bengaluru`,
  `${BASE}/in/patna/plot`,
  `${BASE}/in/patna/flat`,
  `${BASE}/in/ranchi/plot`,
];

export async function POST() {
  const result = await pingIndexNow(KEY_PAGES);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
