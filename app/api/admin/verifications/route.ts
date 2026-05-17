import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  // Lookup role from DB — session may not carry it.
  const u = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true } });
  if (u?.role !== "ADMIN" && u?.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

const PatchBody = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const status = new URL(req.url).searchParams.get("status") ?? "pending";

  const rows = await prisma.verification.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, userId: true, status: true, note: true, createdAt: true, reviewedAt: true,
      aadhaarFrontUrl: true, aadhaarBackUrl: true, selfieUrl: true, panUrl: true, titleDocUrl: true,
      user: { select: { id: true, name: true, phone: true, email: true, role: true } },
    },
  });

  return NextResponse.json({
    verifications: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
    })),
  });
}

export async function PATCH(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { id, decision, note } = parsed.data;

  const existing = await prisma.verification.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const now = new Date();
  await prisma.$transaction([
    prisma.verification.update({
      where: { id },
      data: {
        status: decision === "approve" ? "approved" : "rejected",
        note: note ?? null,
        reviewedBy: auth.session.uid,
        reviewedAt: now,
      },
    }),
    ...(decision === "approve"
      ? [
          prisma.user.update({
            where: { id: existing.userId },
            data: { aadhaarVerified: now },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
