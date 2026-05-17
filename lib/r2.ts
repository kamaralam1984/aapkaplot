/**
 * Cloudflare R2 storage client. R2 is S3-compatible, so we use the AWS SDK
 * with the R2 endpoint. SDK + creds are optional — when env keys are missing,
 * `isConfigured()` returns false and routes fall back to a placeholder URL.
 *
 * Required env (set in .env.local — never commit):
 *   R2_ACCOUNT_ID         — your Cloudflare account id
 *   R2_ACCESS_KEY_ID      — R2 token → S3 access key id
 *   R2_SECRET_ACCESS_KEY  — R2 token → S3 secret access key
 *   R2_BUCKET             — bucket name, e.g. "aapkaplot-media"
 *   R2_PUBLIC_BASE        — public delivery URL, e.g. https://media.aapkaplot.com
 */

import { importOptional } from "./optional-import";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

export function publicUrlFor(key: string): string {
  // R2 buckets are private by default. To make uploaded media reachable:
  //   1. Enable "R2.dev subdomain" on the bucket → `https://pub-<id>.r2.dev`
  //   2. OR add a custom domain (e.g. media.aapkaplot.com) and a CNAME to the
  //      R2 bucket. Set R2_PUBLIC_BASE to that domain.
  const base = process.env.R2_PUBLIC_BASE?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  // No public base — return the S3 API URL (only works with signed requests).
  // Useful for server-side fetches; uploads should set R2_PUBLIC_BASE for
  // browser delivery to work.
  return `https://${process.env.R2_BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

/** Lazy-imported S3 client so the SDK is optional. */
async function getClient() {
  const mod = await importOptional<any>("@aws-sdk/client-s3");
  if (!mod) throw new Error("aws_sdk_missing");
  const { S3Client } = mod;
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured — set R2_* env vars in .env.local");
  }
  const mod = await importOptional<any>("@aws-sdk/client-s3");
  if (!mod) throw new Error("aws_sdk_missing");
  const { PutObjectCommand } = mod;
  const client = await getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return { key, url: publicUrlFor(key) };
}

/** Stable, low-collision object key with the original extension preserved. */
export function buildKey(prefix: string, originalName: string): string {
  const ext = originalName.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";
  const safePrefix = prefix.replace(/[^a-z0-9/_-]/gi, "-").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${safePrefix}/${stamp}-${rand}${ext}`;
}
