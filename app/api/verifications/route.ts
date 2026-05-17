import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });
const unauth = () => NextResponse.json({ error: "unauthenticated" }, { status: 401 });

const Body = z.object({
  aadhaarFrontUrl: z.string().min(4).max(2048),
  aadhaarBackUrl: z.string().max(2048).optional(),
  selfieUrl: z.string().max(2048).optional(),
  panUrl: z.string().max(2048).optional(),
  titleDocUrl: z.string().max(2048).optional(),
  note: z.string().max(500).optional(),
});

/**
 * Submit a verification packet (Aadhaar + optional PAN + selfie).
 * The user's own latest packet is returned by GET — admin uses
 * /api/admin/verifications instead.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  // One pending packet per user — if existing pending, update; else create.
  const existing = await prisma.verification.findFirst({
    where: { userId: session.uid, status: "pending" },
    select: { id: true },
  });

  const row = existing
    ? await prisma.verification.update({
        where: { id: existing.id },
        data: { ...parsed.data },
        select: { id: true, status: true, createdAt: true },
      })
    : await prisma.verification.create({
        data: { userId: session.uid, ...parsed.data },
        select: { id: true, status: true, createdAt: true },
      });

  return NextResponse.json(
    { ok: true, id: row.id, status: row.status, createdAt: row.createdAt.toISOString() },
    { status: 201 }
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const latest = await prisma.verification.findFirst({
    where: { userId: session.uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, status: true, note: true, createdAt: true, reviewedAt: true,
      aadhaarFrontUrl: true, aadhaarBackUrl: true, selfieUrl: true, panUrl: true, titleDocUrl: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { aadhaarVerified: true },
  });

  return NextResponse.json({
    verified: !!user?.aadhaarVerified,
    verifiedAt: user?.aadhaarVerified?.toISOString() ?? null,
    latest: latest
      ? {
          ...latest,
          createdAt: latest.createdAt.toISOString(),
          reviewedAt: latest.reviewedAt?.toISOString() ?? null,
        }
      : null,
  });
}
