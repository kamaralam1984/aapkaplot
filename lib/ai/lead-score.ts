import { prisma } from "@/server/db";

export type BuyerType = "serious" | "investor" | "urgent" | "casual" | "spam";

export function classify(score: number): BuyerType {
  if (score >= 80) return "serious";
  if (score >= 60) return "investor";
  if (score >= 40) return "urgent";
  if (score >= 20) return "casual";
  return "spam";
}

export interface ScoreInput {
  name: string;
  phone?: string;
  email?: string;
  budget?: number; // in lakhs
  location?: string;
  message?: string;
  source?: string;
}

export function ruleScore(data: ScoreInput): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (data.budget && data.budget > 50) {
    score += 30;
    signals.push("High budget (>50L) — serious intent");
  } else if (data.budget && data.budget > 20) {
    score += 20;
    signals.push("Mid budget (>20L) — qualified buyer");
  }

  if (data.message && data.message.length > 50) {
    score += 15;
    signals.push("Detailed message — engaged buyer");
  }

  if (data.email) {
    score += 10;
    signals.push("Email provided — higher credibility");
  }

  if (data.source === "chatbot" || data.source === "whatsapp") {
    score += 10;
    signals.push(`Source "${data.source}" — high-intent channel`);
  }

  const cleanPhone = (data.phone ?? "").replace(/[\s\-+]/g, "").replace(/^91/, "");
  if (/^\d{10}$/.test(cleanPhone)) {
    score += 10;
    signals.push("Valid 10-digit phone number");
  }

  if (data.location && data.location.trim().length > 0) {
    score += 5;
    signals.push("Location preference specified");
  }

  return { score: Math.min(score, 100), signals };
}

export async function aiRefine(
  data: ScoreInput,
  baseScore: number,
  signals: string[],
): Promise<{ score: number; signals: string[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { score: baseScore, signals };

  try {
    const prompt =
      `You are a real estate lead quality analyst for AapKaPlot, an Indian property platform.\n` +
      `Return JSON only: {"adjustment": integer -15 to +15, "signal": short string or null}\n` +
      `Name: ${data.name}, Budget: ${data.budget ? data.budget + "L" : "?"}, Location: ${data.location || "?"}, ` +
      `Message: ${data.message || "none"}, Source: ${data.source ?? "homepage"}, Base score: ${baseScore}/100`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 80,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { score: baseScore, signals };

    const json = await res.json() as { choices: { message: { content: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text.trim()) as { adjustment?: number; signal?: string | null };
    const adjustment = typeof parsed.adjustment === "number"
      ? Math.max(-15, Math.min(15, parsed.adjustment))
      : 0;
    const refinedScore = Math.max(0, Math.min(100, baseScore + adjustment));
    const refinedSignals = [...signals];
    if (parsed.signal && adjustment !== 0) refinedSignals.push(`AI: ${parsed.signal}`);
    return { score: refinedScore, signals: refinedSignals };
  } catch {
    return { score: baseScore, signals };
  }
}

export async function scoreInquiry(inquiryId: string): Promise<void> {
  try {
    const inq = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!inq || inq.leadScore !== null) return; // already scored

    const budgetLakhs = inq.budgetInr ? Math.round(Number(inq.budgetInr) / 100_000) : undefined;
    const input: ScoreInput = {
      name: inq.name,
      phone: inq.phone,
      email: inq.email ?? undefined,
      budget: budgetLakhs,
      location: inq.location ?? undefined,
      message: inq.message ?? undefined,
      source: inq.source,
    };

    let { score, signals } = ruleScore(input);
    ({ score, signals } = await aiRefine(input, score, signals));
    const buyerType = classify(score);

    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { leadScore: score, buyerType },
    });

    console.log(`[lead-score] inquiry ${inquiryId} scored ${score} (${buyerType}) signals: ${signals.join(", ")}`);
  } catch (err) {
    console.error("[lead-score] scoreInquiry failed", err);
  }
}
