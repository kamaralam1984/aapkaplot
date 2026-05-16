import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook-based deploy endpoint.
 *
 * GitHub Actions (or any caller) POSTs here with the bearer secret. We
 * verify the secret in constant time, then spawn `bash deploy/vps-setup.sh`
 * in the background and return 202 immediately so the HTTP request doesn't
 * hold open across an npm-install/build cycle.
 *
 *   Required env on the VPS:
 *     DEPLOY_WEBHOOK_TOKEN  — long random string, must match the caller's bearer
 */

function compare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: Request) {
  const expected = process.env.DEPLOY_WEBHOOK_TOKEN;
  if (!expected || expected.length < 24) {
    return NextResponse.json(
      { error: "deploy_webhook_not_configured" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!provided || !compare(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Spawn fully detached so the API can return immediately. stdout/err go to
  // /var/log/aapkaplot/deploy.log for inspection via `tail -f`.
  const child = spawn("bash", ["deploy/vps-setup.sh"], {
    cwd: "/var/www/aapkaplot",
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
    env: { ...process.env, CI: "1", DEPLOY_TRIGGER: "webhook" },
  });
  child.unref();

  return NextResponse.json(
    {
      ok: true,
      pid: child.pid,
      message: "deploy started — tail /var/log/aapkaplot/deploy.log on VPS to follow",
    },
    { status: 202 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: process.env.DEPLOY_WEBHOOK_TOKEN ? "configured" : "not_configured",
    method: "POST",
    auth: "Authorization: Bearer <DEPLOY_WEBHOOK_TOKEN>",
  });
}
