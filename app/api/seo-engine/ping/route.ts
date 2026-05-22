import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/seo/indexnow";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  }

  let targetUrl: string;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    targetUrl = parsed.toString();
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const result = await pingIndexNow([targetUrl]);
  return NextResponse.json({
    ...result,
    url: targetUrl,
    message: result.ok
      ? `Successfully pinged IndexNow for ${targetUrl}`
      : "IndexNow ping failed — check INDEXNOW_KEY and NEXT_PUBLIC_SITE_URL env vars.",
  });
}
