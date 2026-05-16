import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getSession } from "@/lib/auth-server";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"];

// Files are written to <repo>/public/uploads/<userid>/<key> and served
// directly by Next.js static — URL becomes /uploads/<userid>/<key>.
// The directory is gitignored so files persist across `git pull` deploys.
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

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

  const userDir = join(UPLOAD_DIR, session.uid);
  await mkdir(userDir, { recursive: true });

  const uploaded: { key: string; url: string; size: number; type: string }[] = [];
  for (const f of files) {
    const ext = f.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";
    const filename = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const buffer = Buffer.from(await f.arrayBuffer());
    await writeFile(join(userDir, filename), buffer);
    uploaded.push({
      key: `${session.uid}/${filename}`,
      url: `/uploads/${session.uid}/${filename}`,
      size: f.size,
      type: f.type,
    });
  }

  return NextResponse.json({ uploaded, mode: "local" });
}
