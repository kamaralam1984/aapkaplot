/**
 * Client-side image compression for property uploads.
 *
 * Why: phone cameras produce 5-12 MB JPEG/HEIC files. Uploading the raw
 * file wastes bandwidth, makes the listing page heavy, and HEIC/HEIF /
 * weird formats render as broken images in browsers. Compressing in the
 * browser before upload solves all three: same visible quality, ~5-10×
 * smaller payload, and the result is always a browser-displayable WebP.
 *
 * Uses native `createImageBitmap` + Canvas — no extra dependency.
 * Falls back to JPEG if WebP encoding is unavailable.
 */

export interface CompressOptions {
  /** Max dimension on the long edge (px). Default 1920. */
  maxDim?: number;
  /** WebP/JPEG quality 0–1. Default 0.85 — visually lossless for property photos. */
  quality?: number;
  /** Target MIME type. Default "image/webp". */
  mimeType?: "image/webp" | "image/jpeg";
}

const DEFAULT_MAX_DIM = 1920;
const DEFAULT_QUALITY = 0.85;

/**
 * Resize + re-encode a single image File. Returns the original File
 * unchanged when:
 *  • input is not an image (e.g. video),
 *  • the browser cannot decode the format (e.g. HEIC on Chrome desktop —
 *    we let the server-side ImgBB pipeline handle that path), or
 *  • compression would *increase* the byte count (small icons).
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return file;

  const maxDim = opts.maxDim ?? DEFAULT_MAX_DIM;
  const quality = opts.quality ?? DEFAULT_QUALITY;
  const targetMime: "image/webp" | "image/jpeg" = opts.mimeType ?? "image/webp";

  // 1. Decode. createImageBitmap natively handles JPEG/PNG/WebP/GIF/AVIF and
  //    HEIC on Safari iOS. Chrome desktop will throw on HEIC — fall through.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  // 2. Draw. OffscreenCanvas where available (Chrome/Edge/Safari 17+) lets
  //    encoding run off the main thread; falls back to a DOM canvas.
  let blob: Blob | null = null;
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const off = new OffscreenCanvas(w, h);
      const ctx = off.getContext("2d");
      if (!ctx) throw new Error("no_2d_ctx");
      // Paint white under PNGs converting to JPEG so transparency doesn't
      // come out black.
      if (targetMime === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(bitmap, 0, 0, w, h);
      blob = await off.convertToBlob({ type: targetMime, quality });
    } else {
      const cnv = document.createElement("canvas");
      cnv.width = w; cnv.height = h;
      const ctx = cnv.getContext("2d");
      if (!ctx) throw new Error("no_2d_ctx");
      if (targetMime === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(bitmap, 0, 0, w, h);
      blob = await new Promise<Blob | null>((res) => cnv.toBlob(res, targetMime, quality));
    }
  } catch {
    bitmap.close?.();
    return file;
  }
  bitmap.close?.();

  // 3. WebP encode can silently fail on old browsers (returns null / PNG).
  //    Retry once as JPEG before giving up.
  if (!blob && targetMime === "image/webp") {
    return compressImage(file, { ...opts, mimeType: "image/jpeg" });
  }
  if (!blob) return file;

  // 4. If our compressed version is bigger than the source (rare — tiny
  //    images or already-compressed WebP), keep the original to avoid
  //    pointless re-encoding artefacts.
  if (blob.size >= file.size && file.type === targetMime) return file;

  const ext = targetMime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, { type: targetMime, lastModified: Date.now() });
}

/**
 * Compress a list of files sequentially. Sequential rather than
 * Promise.all so we don't peg the encoder on low-end phones, and so the
 * progress callback ticks smoothly.
 */
export async function compressMany(
  files: File[],
  opts: CompressOptions = {},
  onProgress?: (done: number, total: number) => void,
): Promise<File[]> {
  const out: File[] = [];
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length);
    out.push(await compressImage(files[i], opts));
  }
  onProgress?.(files.length, files.length);
  return out;
}
