import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isR2Configured, putObject, buildKey } from "@/lib/r2";

// 10 MB per file is plenty for property photos.
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"];

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const files = form.getAll("file") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "no_files" }, { status: 400 });
  }

  // ── Validation pass first; reject the whole batch on any bad file. ──
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return NextResponse.json(
        { error: "unsupported_type", got: f.type, allowed: ALLOWED_TYPES },
        { status: 415 }
      );
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large", maxBytes: MAX_BYTES }, { status: 413 });
    }
  }

  // ── No R2 keys → return data URLs so /sell/new still demos end-to-end. ──
  if (!isR2Configured()) {
    const previews = await Promise.all(
      files.map(async (f) => ({
        key: `mock/${f.name}`,
        url: `data:${f.type};base64,${Buffer.from(await f.arrayBuffer()).toString("base64")}`,
        size: f.size,
        type: f.type,
        mode: "mock" as const,
      }))
    );
    return NextResponse.json({ uploaded: previews, mode: "mock" });
  }

  // ── Real upload pass. ──
  const uploaded: { key: string; url: string; size: number; type: string }[] = [];
  for (const f of files) {
    const key = buildKey(`property/${session.uid}`, f.name);
    const buffer = Buffer.from(await f.arrayBuffer());
    const { url } = await putObject(key, buffer, f.type);
    uploaded.push({ key, url, size: f.size, type: f.type });
  }

  return NextResponse.json({ uploaded, mode: "r2" });
}
