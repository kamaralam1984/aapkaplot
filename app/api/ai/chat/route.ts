import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/ai/chat
 *
 * Lightweight AI assistant for buyers / sellers. Knows the AapKaPlot
 * platform basics (how to post, how to pay for boost, how the trust
 * badge works) and Indian real-estate basics. Stateless — the client
 * sends the full conversation each turn.
 *
 * MVP: single-turn OpenAI call with a primed system prompt. Production
 * would add tool-calling (e.g. "find properties in X", "estimate price")
 * and persistent threads.
 */
const Msg = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});
const Body = z.object({
  messages: z.array(Msg).min(1).max(20),
});

const SYSTEM = [
  "You are AapKaPlot Assistant — a polite, concise helper on India's verified real-estate platform.",
  "You can: explain how to list a property, what verification does, how boosts work, how offers and negotiation work, and general Indian property terminology (RERA, sqft vs katha vs bigha, Vastu).",
  "If asked about a specific property's price, suggest the user open the listing and use the AI valuation button there.",
  "Always reply in the same language the user wrote (English or Hindi). Keep answers ≤ 120 words.",
  "Never invent facts about a specific listing. If unsure, say so.",
].join(" ");

export async function POST(req: Request) {
  const limited = await rateLimit(req, { key: "ai-chat", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      reply:
        "AI chat needs an OPENAI_API_KEY on the server. Meanwhile: check the Help page or post your question to support@aapkaplot.com.",
      source: "fallback",
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        max_tokens: 280,
        temperature: 0.5,
        messages: [{ role: "system", content: SYSTEM }, ...parsed.data.messages],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`openai_status_${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a reply.";
    return NextResponse.json({ reply, source: "openai" });
  } catch (err) {
    return NextResponse.json(
      { reply: "AI is temporarily unavailable. Please try again in a minute.", source: "error", detail: (err as Error).message },
      { status: 200 },
    );
  }
}
