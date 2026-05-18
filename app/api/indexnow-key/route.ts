/**
 * Serves the IndexNow verification text at /api/indexnow-key
 *
 * IndexNow lets the key file live at any URL as long as `keyLocation`
 * in the ping body points to it. We keep it under /api/ to avoid any
 * top-level route collisions; the key value comes from env.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new NextResponse("Not configured", { status: 404 });
  return new NextResponse(key, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
