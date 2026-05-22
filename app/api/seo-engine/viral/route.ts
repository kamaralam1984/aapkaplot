import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { url?: string; pageTitle?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { url = "", pageTitle = "Real Estate Listing" } = body;
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "groq_not_configured" }, { status: 503 });
  }

  const prompt = `Generate viral social media posts for this Indian real estate page: '${pageTitle.slice(0, 200)}' at ${url}. Make posts engaging, use emojis, and tailor for each platform. Include Indian real estate enthusiasm. Return ONLY valid JSON with no markdown: { "whatsapp": "post text", "facebook": "post text", "instagram": "post text", "twitter": "post text", "linkedin": "post text", "telegram": "post text", "hashtags": ["tag1","tag2","tag3","tag4","tag5"], "estimatedReach": "125K+" }`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "groq_error", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown> = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // fallback
    }

    const fallbackPost = `🏠 Amazing property opportunity! Check out "${pageTitle}" at ${url} — don't miss this deal! #RealEstate #AapKaPlot #Property #India`;

    return NextResponse.json({
      whatsapp:  typeof parsed.whatsapp  === "string" ? parsed.whatsapp  : fallbackPost,
      facebook:  typeof parsed.facebook  === "string" ? parsed.facebook  : fallbackPost,
      instagram: typeof parsed.instagram === "string" ? parsed.instagram : fallbackPost,
      twitter:   typeof parsed.twitter   === "string" ? parsed.twitter   : fallbackPost,
      linkedin:  typeof parsed.linkedin  === "string" ? parsed.linkedin  : fallbackPost,
      telegram:  typeof parsed.telegram  === "string" ? parsed.telegram  : fallbackPost,
      hashtags:  Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#RealEstate", "#AapKaPlot", "#Property", "#India", "#BuyPlot"],
      estimatedReach: typeof parsed.estimatedReach === "string" ? parsed.estimatedReach : "125K+",
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
