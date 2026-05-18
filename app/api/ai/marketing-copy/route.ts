/**
 * AI marketing copy generator.
 *
 * POST body:
 *   channel: "whatsapp" | "instagram" | "facebook" | "google-ad" | "email-subject" | "sms"
 *   topic:   free text — what the copy is about
 *   audience?: { city?, locality?, budget?, intent? }
 *   variants?: number   default 3, max 5
 *   tone?:   "urgent" | "warm" | "luxe" | "informative"   default warm
 *   lang?:   "en" | "hi" | "hinglish"   default hinglish
 *
 * Returns: { copies: string[] }
 *
 * Channel-aware length limits:
 *   sms: ≤ 160 chars
 *   whatsapp: ≤ 350 chars (3 lines)
 *   instagram/facebook caption: ≤ 220 chars + 6 hashtags
 *   google-ad: headline (≤ 30 chars) + description (≤ 90 chars)
 *   email-subject: ≤ 60 chars
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/api/admin/seo/_auth";
import { complete } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  channel: z.enum(["whatsapp", "instagram", "facebook", "google-ad", "email-subject", "sms"]),
  topic: z.string().min(3).max(280),
  audience: z.object({
    city: z.string().optional(),
    locality: z.string().optional(),
    budget: z.string().optional(),
    intent: z.string().optional(),
  }).default({}),
  variants: z.coerce.number().int().min(1).max(5).default(3),
  tone: z.enum(["urgent", "warm", "luxe", "informative"]).default("warm"),
  lang: z.enum(["en", "hi", "hinglish"]).default("hinglish"),
});

const CHANNEL_GUIDE: Record<string, string> = {
  whatsapp:        "Write WhatsApp broadcast text. ≤ 350 chars, 2-3 lines. Plain text. One CTA line at the end like 'Reply YES for details'.",
  instagram:       "Write Instagram caption. ≤ 220 chars main text + EXACTLY 6 hashtags on a new line. Hooks reader in the first 8 words.",
  facebook:        "Write Facebook post copy. ≤ 220 chars. Conversational, light emoji okay. End with a question to drive comments.",
  "google-ad":     "Write a Google Search ad: HEADLINE (≤ 30 chars) on line 1, DESCRIPTION (≤ 90 chars) on line 2. Include the city/locality keyword.",
  "email-subject": "Write an email subject line ≤ 60 chars. High open-rate, no clickbait, no spam triggers like FREE!!!.",
  sms:             "Write SMS body ≤ 160 chars. Plain text. End with a short URL placeholder {url} and reply-stop note.",
};

const TONE_GUIDE: Record<string, string> = {
  urgent: "Create gentle urgency — limited stock, time-sensitive, but don't over-hype.",
  warm: "Friendly, helpful, neighbour-talking-to-neighbour tone.",
  luxe: "Premium, aspirational, restrained vocabulary. Use 'residence' over 'house', 'investment' over 'buy'.",
  informative: "Educational, fact-driven. Lead with a stat or insight.",
};

const LANG_GUIDE: Record<string, string> = {
  en: "Write in clear English.",
  hi: "Hindi me likho (Devanagari).",
  hinglish: "Hinglish (Roman script with natural Hindi words). DO NOT switch to pure Hindi.",
};

function fallbackCopies(b: z.infer<typeof Body>): string[] {
  const place = b.audience.locality ?? b.audience.city ?? "your area";
  const out: string[] = [];
  for (let i = 0; i < b.variants; i++) {
    if (b.channel === "whatsapp")
      out.push(`Fresh verified ${b.topic.toLowerCase()} listings in ${place} on AapKaPlot. ${b.audience.budget ? `Budget ${b.audience.budget}.` : ""} Reply YES — we'll share the shortlist.`);
    else if (b.channel === "sms")
      out.push(`AapKaPlot: ${b.topic} in ${place}. Verified listings. {url} STOP to opt out.`);
    else if (b.channel === "google-ad")
      out.push(`${b.topic} in ${place}\nVerified listings · AI-priced · WhatsApp support. Visit AapKaPlot.`);
    else if (b.channel === "email-subject")
      out.push(`${b.topic} in ${place} — verified picks inside`);
    else if (b.channel === "instagram")
      out.push(`${b.topic} in ${place} — verified, AI-priced, WhatsApp-fast.\nDM us your budget and we'll send 3 best fits.\n#AapKaPlot #${place.replace(/\s/g, "")} #RealEstateIndia #PropertyHunt #VerifiedListing #BiharProperty`);
    else
      out.push(`${b.topic} in ${place} — what's your budget? Drop a comment, we'll DM verified options.`);
  }
  return out;
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const system = [
    "You are AapKaPlot's marketing copywriter — punchy, on-brand, India-aware.",
    "Brand voice: friendly, direct, slightly bold, never spammy.",
    "Always mention AapKaPlot once. Use locality/city names when provided.",
    CHANNEL_GUIDE[parsed.data.channel],
    TONE_GUIDE[parsed.data.tone],
    LANG_GUIDE[parsed.data.lang],
    `Return JSON: { "copies": [string, ...] } with exactly ${parsed.data.variants} variant${parsed.data.variants > 1 ? "s" : ""}.`,
  ].join(" ");

  const user = [
    `Topic: ${parsed.data.topic}`,
    `Audience: ${JSON.stringify(parsed.data.audience)}`,
  ].join("\n");

  const result = await complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.9,
    maxTokens: 700,
    responseFormat: "json",
  });

  if (!result.ok) {
    return NextResponse.json({ copies: fallbackCopies(parsed.data), source: "fallback", reason: result.reason });
  }
  try {
    const obj = JSON.parse(result.text);
    if (Array.isArray(obj.copies) && obj.copies.every((s: unknown) => typeof s === "string")) {
      return NextResponse.json({ copies: obj.copies, source: result.source, model: result.model });
    }
  } catch { /* fall through */ }
  return NextResponse.json({ copies: fallbackCopies(parsed.data), source: "fallback", reason: "OpenAI returned non-JSON" });
}
