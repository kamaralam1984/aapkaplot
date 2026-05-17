import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getSession } from "@/lib/auth-server";

const MAX_BYTES = 10 * 1024 * 1024;
const IMGBB_MAX_BYTES = 32 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"];
const IMGBB_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export const runtime = "nodejs";

type Uploaded = {
  key: string;
  url: string;
  size: number;
  type: string;
  deleteUrl?: string;
};

async function uploadToImgBB(file: File, apiKey: string): Promise<Uploaded> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fd = new FormData();
  fd.append("image", new Blob([buffer], { type: file.type }));
  fd.append("name", file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "upload");

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    body: fd,
  });
  const json: unknown = await res.json().catch(() => ({}));
  const j = json as { success?: boolean; data?: { url?: string; display_url?: string; delete_url?: string; id?: string }; error?: { message?: string } };

  if (!res.ok || !j.success || !j.data?.url) {
    throw new Error(j.error?.message ?? `imgbb_http_${res.status}`);
  }

  return {
    key: j.data.id ?? `imgbb-${Date.now().toString(36)}`,
    url: j.data.display_url ?? j.data.url,
    size: file.size,
    type: file.type,
    deleteUrl: j.data.delete_url,
  };
}

async function uploadLocal(file: File, uid: string): Promise<Uploaded> {
  const userDir = join(UPLOAD_DIR, uid);
  await mkdir(userDir, { recursive: true });
  const ext = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";
  const filename = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(userDir, filename), buffer);
  return {
    key: `${uid}/${filename}`,
    url: `/uploads/${uid}/${filename}`,
    size: file.size,
    type: file.type,
  };
}

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

  const imgbbKey = process.env.IMGBB_API_KEY?.trim();
  const useImgBB = !!imgbbKey;
  const sizeCap = useImgBB ? IMGBB_MAX_BYTES : MAX_BYTES;

  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return NextResponse.json(
        { error: "unsupported_type", got: f.type, allowed: ALLOWED_TYPES },
        { status: 415 }
      );
    }
    if (f.size > sizeCap) {
      return NextResponse.json({ error: "file_too_large", maxBytes: sizeCap }, { status: 413 });
    }
  }

  const uploaded: Uploaded[] = [];
  const failures: { name: string; error: string }[] = [];

  for (const f of files) {
    const goesToImgBB = useImgBB && IMGBB_TYPES.has(f.type);
    try {
      if (goesToImgBB) {
        uploaded.push(await uploadToImgBB(f, imgbbKey!));
      } else {
        uploaded.push(await uploadLocal(f, session.uid));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "upload_failed";
      // ImgBB transient failure → fall back to local so the user isn't blocked.
      if (goesToImgBB) {
        try {
          uploaded.push(await uploadLocal(f, session.uid));
        } catch {
          failures.push({ name: f.name, error: msg });
        }
      } else {
        failures.push({ name: f.name, error: msg });
      }
    }
  }

  if (uploaded.length === 0) {
    return NextResponse.json({ error: "all_uploads_failed", failures }, { status: 502 });
  }

  return NextResponse.json({
    uploaded,
    failures,
    mode: useImgBB ? "imgbb" : "local",
  });
}
