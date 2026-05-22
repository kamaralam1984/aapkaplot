import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";

async function adminGuard() {
  const session = await getSession();
  if (!session) return { session: null, err: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!isAdminRole(session.role)) return { session: null, err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, err: null };
}

export async function GET() {
  const { err } = await adminGuard();
  if (err) return err;

  if (process.env.USE_DB !== "1") {
    return NextResponse.json({
      total: 0, pending: 0, emailed: 0, replied: 0, converted: 0, hot: 0, warm: 0, cold: 0, avgScore: 0, topProspects: [],
    });
  }

  const [total, pending, emailed, replied, converted, hot, warm, cold, avgScoreResult, topProspects] = await Promise.all([
    prisma.outreachProspect.count(),
    prisma.outreachProspect.count({ where: { status: "pending" } }),
    prisma.outreachProspect.count({ where: { status: "emailed" } }),
    prisma.outreachProspect.count({ where: { status: "replied" } }),
    prisma.outreachProspect.count({ where: { status: "converted" } }),
    prisma.outreachProspect.count({ where: { interestLabel: "hot" } }),
    prisma.outreachProspect.count({ where: { interestLabel: "warm" } }),
    prisma.outreachProspect.count({ where: { interestLabel: "cold" } }),
    prisma.outreachProspect.aggregate({ _avg: { interestScore: true } }),
    prisma.outreachProspect.findMany({
      orderBy: { interestScore: "desc" },
      take: 5,
      select: { id: true, businessName: true, city: true, interestScore: true, interestLabel: true, status: true },
    }),
  ]);

  return NextResponse.json({
    total,
    pending,
    emailed,
    replied,
    converted,
    hot,
    warm,
    cold,
    avgScore: Math.round(avgScoreResult._avg.interestScore ?? 0),
    topProspects,
  });
}
