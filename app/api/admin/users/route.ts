import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

const dbOff = () => NextResponse.json({ error: "db_disabled" }, { status: 503 });

const ListQuery = z.object({
  role: z.enum(["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  suspended: z.enum(["true", "false"]).optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const parsed = ListQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { role, suspended, q, page, pageSize } = parsed.data;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(suspended ? { suspended: suspended === "true" } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" } as Prisma.UserOrderByWithRelationInput,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true, email: true, phone: true, name: true,
        role: true, suspended: true, createdAt: true,
        emailVerified: true, phoneVerified: true,
        _count: { select: { properties: true, leadsSent: true } },
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, rows });
}

const CreateBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(60).optional(),
  phone: z.string().min(5).max(20).optional(),
  role: z.enum(["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]).default("BUYER"),
});

export async function POST(req: Request) {
  if (process.env.USE_DB !== "1") return dbOff();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { email, name, phone, role } = parsed.data;
  const lower = email.toLowerCase().trim();

  try {
    const created = await prisma.user.create({
      data: {
        email: lower,
        name: name ?? null,
        phone: phone ?? `email:${lower}`,
        role,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, role: true },
    });
    void recordAudit(guard.session, "user.create", "user", created.id, { email: lower, role });
    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const conflict = msg.includes("Unique constraint");
    return NextResponse.json(
      { error: conflict ? "already_exists" : "db_error", message: msg },
      { status: conflict ? 409 : 500 },
    );
  }
}
