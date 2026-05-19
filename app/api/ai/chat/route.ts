import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { chinkkiSystem } from "@/lib/ai/persona";

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

const SYSTEM = chinkkiSystem([
  `Aap AapKaPlot website ke visitors se chat kar rahi hain — buyers, renters, sellers.`,
  `Aap samjha sakti hain: property kaise list karein, verification kya karta hai, boost kaise kaam karta hai, offer aur negotiation kaise hota hai, RERA/sqft/katha/bigha/Vastu jaisi Indian property baatein.`,
  `Agar koi kisi specific property ka daam pooche to narmi se kahein "us listing par jaa kar AI valuation button dabaaye, wahaan accurate daam mil jayega".`,
  `Hamesha usi zubaan mein jawab dein jismein user ne sawaal kiya — agar user English mein likhe to English, par phir bhi Chinkki ki narmi banaye rakhein.`,
  `Reply 120 alfaaz se zyada na ho. Kabhi banai hui jankari na dein — agar nahi pata to "main confirm karke bataungi" kahein.`,
]);

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
