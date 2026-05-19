import { type NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_ROOT = resolve(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
};

// `next start` only serves files that exist in /public at build time. Files
// written by the upload route at runtime (sellers posting listings) are
// invisible to the static-public handler. This route reads them off disk on
// every request so seller-uploaded media keeps working without ImgBB.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  if (!parts?.length) return new NextResponse(null, { status: 404 });

  const fullPath = resolve(UPLOAD_ROOT, ...parts);
  if (fullPath !== UPLOAD_ROOT && !fullPath.startsWith(UPLOAD_ROOT + sep)) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const s = await stat(fullPath);
    if (!s.isFile()) return new NextResponse(null, { status: 404 });

    const ext = fullPath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    const data = await readFile(fullPath);

    return new NextResponse(data, {
      headers: {
        "content-type": contentType,
        "content-length": String(s.size),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
