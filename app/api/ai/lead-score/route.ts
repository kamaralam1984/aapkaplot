/**
 * AI Lead Scoring API
 *
 * POST /api/ai/lead-score
 * Body: { name, phone, budget, location, message, source, inquiryId? }
 *
 * Returns: { score, buyerType, signals }
 *
 * Rule-based scoring (0–100) + optional Claude Haiku sentiment refinement.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { ruleScore, aiRefine, classify } from "@/lib/ai/lead-score";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  name:      z.string().min(1),
  phone:     z.string().optional().default(""),
  email:     z.string().email().optional(),
  budget:    z.number().optional(),          // in lakhs (e.g. 45 = 45L)
  location:  z.string().optional(),
  message:   z.string().optional().default(""),
  source:    z.string().optional().default("homepage"),
  inquiryId: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Rule-based scoring
  let { score, signals } = ruleScore(data);

  // Optional AI refinement
  ({ score, signals } = await aiRefine(data, score, signals));

  const buyerType = classify(score);

  // Update Inquiry record if ID provided
  if (data.inquiryId && process.env.USE_DB === "1") {
    try {
      await prisma.inquiry.update({
        where: { id: data.inquiryId },
        data: { leadScore: score, buyerType },
      });
    } catch {
      // Non-fatal — record may not exist
    }
  }

  return NextResponse.json({ score, buyerType, signals });
}
