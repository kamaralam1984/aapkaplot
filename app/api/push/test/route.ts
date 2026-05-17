import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

/**
 * POST /api/push/test — sends a "hello" push to all of the caller's
 * subscriptions. Used by the opt-in UI to confirm push works end-to-end.
 */
export async function POST() {
  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ error: "db_disabled" }, { status: 503 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const delivered = await sendPushToUser(session.uid, {
    title: "AapKaPlot push is live ✨",
    body: "You'll get instant updates on new leads, price drops and visit confirmations.",
    url: "/me",
    tag: "akp-test",
  });

  return NextResponse.json({ ok: true, delivered });
}
