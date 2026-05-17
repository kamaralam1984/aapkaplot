import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Stream = "out" | "error";

function logPath(stream: Stream): string {
  // PM2 default: ${PM2_HOME ?? ~/.pm2}/logs/<name>-<stream>.log
  const home = process.env.PM2_HOME ?? path.join(os.homedir(), ".pm2");
  return path.join(home, "logs", `aapkaplot-${stream}.log`);
}

async function tail(file: string, maxBytes = 64 * 1024): Promise<string> {
  try {
    const handle = await fs.open(file, "r");
    try {
      const { size } = await handle.stat();
      const offset = Math.max(0, size - maxBytes);
      const length = size - offset;
      const buf = Buffer.alloc(length);
      await handle.read(buf, 0, length, offset);
      return buf.toString("utf8");
    } finally {
      await handle.close();
    }
  } catch (err) {
    const msg = (err as NodeJS.ErrnoException).code === "ENOENT"
      ? "(no log file yet)"
      : `(read error: ${(err as Error).message})`;
    return msg;
  }
}

function detectLevel(line: string): "error" | "warn" | "info" {
  const lower = line.toLowerCase();
  if (/\b(error|err|fail|exception|stack|prisma:error)\b/.test(lower)) return "error";
  if (/\b(warn|warning|deprecated)\b/.test(lower)) return "warn";
  return "info";
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const stream = (url.searchParams.get("stream") === "error" ? "error" : "out") as Stream;
  const level = url.searchParams.get("level"); // null | error | warn | info
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";

  const text = await tail(logPath(stream));
  const lines = text.split("\n").filter(Boolean).slice(-500).reverse();

  const rows = lines
    .map((line) => ({ line, level: detectLevel(line) }))
    .filter((r) => (level ? r.level === level : true))
    .filter((r) => (q ? r.line.toLowerCase().includes(q) : true));

  return NextResponse.json({
    stream,
    path: logPath(stream),
    count: rows.length,
    rows,
  });
}
