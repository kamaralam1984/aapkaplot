/**
 * Public homepage inquiry capture.
 *
 * POST body: { name, phone, budget?, location?, message?, source? }
 *   - name: 2-80 chars
 *   - phone: 10-digit Indian mobile (6-9 prefix)
 *   - budget: optional, "min-max" inr string
 *   - location: optional, free text
 *   - message: optional, ≤500 chars
 *   - source: "homepage" | "chatbot" | "whatsapp"
 *
 * Persists to Inquiry table; never echoes PII back beyond an ok flag.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().transform((p) => p.replace(/\D/g, "").slice(-10)).refine((p) => /^[6-9]\d{9}$/.test(p), "Invalid mobile"),
  email: z.string().email().optional(),
  budget: z.string().optional(),
  location: z.string().trim().max(120).optional(),
  message: z.string().trim().max(500).optional(),
  source: z.enum(["homepage", "chatbot", "whatsapp"]).optional(),
});

function parseBudget(b?: string): bigint | null {
  if (!b) return null;
  // Form sends "0-2000000", "30000000-0" (for "3 Cr+"); store the upper bound.
  const [, max] = b.split("-").map(Number);
  if (Number.isFinite(max) && max > 0) return BigInt(max);
  const [min] = b.split("-").map(Number);
  if (Number.isFinite(min) && min > 0) return BigInt(min);
  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "validation failed" }, { status: 400 });
  }
  const data = parsed.data;

  try {
    await prisma.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        budgetInr: parseBudget(data.budget),
        location: data.location,
        message: data.message,
        source: data.source ?? "homepage",
      },
    });
  } catch (err) {
    console.error("[inquiry] persist_failed", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
