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
import { importOptional } from "@/lib/optional-import";

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

type BuyerType = "serious" | "investor" | "urgent" | "casual" | "spam";

function classify(score: number): BuyerType {
  if (score >= 80) return "serious";
  if (score >= 60) return "investor";
  if (score >= 40) return "urgent";
  if (score >= 20) return "casual";
  return "spam";
}

function ruleScore(data: z.infer<typeof Body>): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  // Budget scoring
  if (data.budget && data.budget > 50) {
    score += 30;
    signals.push("High budget (>50L) — serious intent");
  } else if (data.budget && data.budget > 20) {
    score += 20;
    signals.push("Mid budget (>20L) — qualified buyer");
  }

  // Message quality
  if (data.message && data.message.length > 50) {
    score += 15;
    signals.push("Detailed message — engaged buyer");
  }

  // Email present
  if (data.email) {
    score += 10;
    signals.push("Email provided — higher credibility");
  }

  // Source quality
  if (data.source === "chatbot" || data.source === "whatsapp") {
    score += 10;
    signals.push(`Source "${data.source}" — high-intent channel`);
  }

  // Valid phone (10 digits after stripping spaces/dashes)
  const cleanPhone = (data.phone ?? "").replace(/[\s\-+]/g, "").replace(/^91/, "");
  if (/^\d{10}$/.test(cleanPhone)) {
    score += 10;
    signals.push("Valid 10-digit phone number");
  }

  // Location specified
  if (data.location && data.location.trim().length > 0) {
    score += 5;
    signals.push("Location preference specified");
  }

  return { score: Math.min(score, 100), signals };
}

async function aiRefine(
  data: z.infer<typeof Body>,
  baseScore: number,
  signals: string[],
): Promise<{ score: number; signals: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { score: baseScore, signals };

  try {
    const mod = await importOptional("@anthropic-ai/sdk");
    if (!mod) return { score: baseScore, signals };
    const Anthropic = mod.default ?? mod;
    const client = new Anthropic({ apiKey });

    const prompt = [
      "You are a real estate lead quality analyst for AapKaPlot, an Indian property platform.",
      "Analyze this inquiry and return a JSON object with two fields:",
      '  "adjustment": integer between -15 and +15 (how much to adjust the base score)',
      '  "signal": one short human-readable string explaining the adjustment (or null if 0)',
      "",
      `Lead details:`,
      `  Name: ${data.name}`,
      `  Budget: ${data.budget ? data.budget + "L" : "not specified"}`,
      `  Location: ${data.location || "not specified"}`,
      `  Message: ${data.message || "(none)"}`,
      `  Source: ${data.source}`,
      `  Base score: ${baseScore}/100`,
      "",
      "Return only the JSON object, no other text.",
    ].join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text.trim());

    const adjustment = typeof parsed.adjustment === "number"
      ? Math.max(-15, Math.min(15, parsed.adjustment))
      : 0;

    const refinedScore = Math.max(0, Math.min(100, baseScore + adjustment));
    const refinedSignals = [...signals];
    if (parsed.signal && adjustment !== 0) {
      refinedSignals.push(`AI: ${parsed.signal}`);
    }

    return { score: refinedScore, signals: refinedSignals };
  } catch {
    // Never fail — fall back to rule-based score
    return { score: baseScore, signals };
  }
}

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
