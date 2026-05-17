import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { slugify } from "@/lib/broker";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });
const unauth = () => NextResponse.json({ error: "unauthenticated" }, { status: 401 });

const Body = z.object({
  agencyName: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  panNumber: z.string().max(20).optional(),
  reraNumber: z.string().max(40).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  defaultCommissionPct: z.number().min(0.1).max(10).optional(),
  payoutMethod: z.enum(["upi", "bank"]).optional(),
  payoutDetails: z.object({
    upi: z.string().max(64).optional(),
    accountNumber: z.string().max(32).optional(),
    ifsc: z.string().max(20).optional(),
    holderName: z.string().max(120).optional(),
  }).optional(),
});

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "broker";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const taken = await prisma.brokerProfile.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const profile = await prisma.brokerProfile.findUnique({
    where: { userId: session.uid },
    include: { user: { select: { name: true, phone: true, email: true } } },
  });
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.brokerProfile.findUnique({ where: { userId: session.uid } });
  if (existing) {
    return NextResponse.json({ error: "profile_exists", profileId: existing.id }, { status: 409 });
  }

  const slug = await uniqueSlug(data.agencyName);

  const profile = await prisma.brokerProfile.create({
    data: {
      userId: session.uid,
      slug,
      agencyName: data.agencyName,
      panNumber: data.panNumber ?? null,
      reraNumber: data.reraNumber ?? null,
      city: data.city,
      state: data.state,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl ?? null,
      defaultCommissionPct: data.defaultCommissionPct ?? 1.0,
      payoutMethod: data.payoutMethod ?? null,
      payoutDetails: data.payoutDetails ? (data.payoutDetails as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  // Promote the user to AGENT role for downstream checks.
  await prisma.user.update({
    where: { id: session.uid },
    data: { role: "AGENT" },
  });

  return NextResponse.json({ ok: true, profile }, { status: 201 });
}

const PatchBody = Body.partial();

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return unauth();
  if (process.env.USE_DB !== "1") return dbOff();

  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const d = parsed.data;

  const updated = await prisma.brokerProfile.update({
    where: { userId: session.uid },
    data: {
      ...(d.agencyName !== undefined && { agencyName: d.agencyName }),
      ...(d.panNumber !== undefined && { panNumber: d.panNumber }),
      ...(d.reraNumber !== undefined && { reraNumber: d.reraNumber }),
      ...(d.city !== undefined && { city: d.city }),
      ...(d.state !== undefined && { state: d.state }),
      ...(d.bio !== undefined && { bio: d.bio }),
      ...(d.avatarUrl !== undefined && { avatarUrl: d.avatarUrl }),
      ...(d.defaultCommissionPct !== undefined && { defaultCommissionPct: d.defaultCommissionPct }),
      ...(d.payoutMethod !== undefined && { payoutMethod: d.payoutMethod }),
      ...(d.payoutDetails !== undefined && { payoutDetails: d.payoutDetails as Prisma.InputJsonValue }),
    },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
