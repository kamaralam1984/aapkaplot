import { NextResponse } from "next/server";
import { spawn, spawnSync } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function compare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Whitelist of env keys the webhook is allowed to mutate. Prevents the
// caller from injecting arbitrary keys (e.g. JWT_SECRET) even with a
// valid bearer.
const ENV_WRITE_ALLOWLIST = new Set([
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
]);

function upsertEnvFile(path: string, updates: Record<string, string>): { replaced: string[]; added: string[] } {
  const existing = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of existing) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (m && updates[m[1]] !== undefined) {
      const v = updates[m[1]];
      const quoted = /\\n| /.test(v) ? `"${v}"` : v;
      out.push(`${m[1]}=${quoted}`);
      seen.add(m[1]);
    } else {
      out.push(line);
    }
  }
  if (out.length && out[out.length - 1] !== "") out.push("");
  const added: string[] = [];
  for (const k of Object.keys(updates)) {
    if (seen.has(k)) continue;
    if (added.length === 0) out.push("# webhook-managed env");
    const v = updates[k];
    const quoted = /\\n| /.test(v) ? `"${v}"` : v;
    out.push(`${k}=${quoted}`);
    added.push(k);
  }
  writeFileSync(path, out.join("\n"), { mode: 0o600 });
  return { replaced: Array.from(seen), added };
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

  // Optional body — supports two modes that can combine:
  //   { envUpdates: { KEY: VALUE, ... } }  → write whitelisted keys to .env.local
  //   { reloadOnly: true }                 → skip git pull/build, just pm2 reload
  let body: { envUpdates?: Record<string, string>; reloadOnly?: boolean } = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    body = await req.json().catch(() => ({}));
  }

  let envSummary: { replaced: string[]; added: string[]; rejected: string[] } | null = null;
  if (body.envUpdates && typeof body.envUpdates === "object") {
    const filtered: Record<string, string> = {};
    const rejected: string[] = [];
    for (const [k, v] of Object.entries(body.envUpdates)) {
      if (ENV_WRITE_ALLOWLIST.has(k) && typeof v === "string") filtered[k] = v;
      else rejected.push(k);
    }
    const r = upsertEnvFile("/var/www/aapkaplot/.env.local", filtered);
    envSummary = { ...r, rejected };
  }

  if (body.reloadOnly) {
    // Synchronous PM2 reload (fast enough for the HTTP timeout).
    const res = spawnSync("pm2", ["reload", "aapkaplot", "--update-env"], {
      cwd: "/var/www/aapkaplot",
      timeout: 25_000,
    });
    return NextResponse.json(
      {
        ok: res.status === 0,
        env: envSummary,
        pm2: { code: res.status, stderr: res.stderr?.toString().slice(0, 500) },
      },
      { status: res.status === 0 ? 202 : 500 }
    );
  }

  // Default: full git-pull + build + reload via vps-setup.sh
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
      env: envSummary,
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
