/**
 * AI-drafted email.
 *
 * POST body:
 *   purpose: "welcome" | "lead-followup" | "site-visit" | "price-drop" | "marketing"
 *   to:      { name?, phone?, city?, locality?, budget? }   // recipient context
 *   context: { propertyTitle?, propertyUrl?, notes? }       // listing context (optional)
 *   tone?:   "warm" | "formal" | "playful"   default warm
 *   lang?:   "en" | "hi" | "hinglish"        default hinglish
 *
 * Returns: { subject, body, source }
 *
 * Falls back to a templated draft when OPENAI_API_KEY is absent so the
 * admin UI keeps working in dev.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/api/admin/seo/_auth";
import { complete } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Schema = z.object({
  purpose: z.enum(["welcome", "lead-followup", "site-visit", "price-drop", "marketing"]),
  to: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    locality: z.string().optional(),
    budget: z.string().optional(),
  }).default({}),
  context: z.object({
    propertyTitle: z.string().optional(),
    propertyUrl: z.string().url().optional(),
    notes: z.string().max(500).optional(),
  }).default({}),
  tone: z.enum(["warm", "formal", "playful"]).default("warm"),
  lang: z.enum(["en", "hi", "hinglish"]).default("hinglish"),
});

const PURPOSE_GUIDE: Record<string, string> = {
  "welcome":         "Welcome a new inquiry. Acknowledge their preferences, set expectation of a curated shortlist within 30 minutes, and end with a WhatsApp CTA.",
  "lead-followup":   "Follow up with a prospect who hasn't replied in 2-3 days. Friendly nudge, restate the value, propose a quick site visit slot.",
  "site-visit":      "Confirm a scheduled site visit. Include the date/time placeholder, what to carry, and how to reach the listing.",
  "price-drop":      "Notify the prospect a property in their saved range has just dropped in price. Create gentle urgency without being pushy.",
  "marketing":       "Generic monthly marketing email — fresh listings teaser, one AapKaPlot value reminder, soft CTA to browse.",
};

const LANG_GUIDE: Record<string, string> = {
  "en":       "Write in clear, friendly English.",
  "hi":       "Hindi me likho — Devanagari script use karo.",
  "hinglish": "Hinglish me likho — Roman script with natural Hindi words where it feels normal in Indian conversation. Do NOT switch to pure Hindi.",
};

const TONE_GUIDE: Record<string, string> = {
  "warm": "Warm and personal. Use the recipient's first name once. Avoid corporate jargon.",
  "formal": "Polite, business-formal. No emojis. Address as Mr./Ms. (use \"Sir/Madam\" if no name).",
  "playful": "Light and friendly. One tasteful emoji max. Stay professional — this is real estate, not a meme.",
};

function fallbackDraft(parsed: z.infer<typeof Schema>): { subject: string; body: string } {
  const name = parsed.to.name ?? "there";
  const place = parsed.to.locality ?? parsed.to.city ?? "your preferred location";
  switch (parsed.purpose) {
    case "welcome":
      return {
        subject: `Welcome to AapKaPlot, ${name}! 🏡`,
        body: `Hi ${name},\n\nThanks for reaching out to AapKaPlot. We've noted your interest in property in ${place}${parsed.to.budget ? ` around ${parsed.to.budget}` : ""}. Our team is curating 3-5 verified options for you and will send them on WhatsApp shortly.\n\nMeanwhile, feel free to ping us on WhatsApp +91 70391 25391 — we respond in minutes.\n\nWarm regards,\nTeam AapKaPlot`,
      };
    case "lead-followup":
      return {
        subject: `Still hunting for property in ${place}?`,
        body: `Hi ${name},\n\nWe pulled a few fresh verified listings in ${place} matching your earlier preferences. Want us to send them over on WhatsApp, or schedule a quick site visit this weekend?\n\nReply to this email or ping us on +91 70391 25391.\n\n— AapKaPlot`,
      };
    case "site-visit":
      return {
        subject: `Site visit confirmed — ${parsed.context.propertyTitle ?? "your shortlisted property"}`,
        body: `Hi ${name},\n\nYour site visit is confirmed. Our local expert will meet you at the address — please carry one ID proof for entry. The property: ${parsed.context.propertyUrl ?? "(link will be shared on WhatsApp)"}.\n\nQuestions? WhatsApp us anytime on +91 70391 25391.\n\nSee you there!\nTeam AapKaPlot`,
      };
    case "price-drop":
      return {
        subject: `Price drop alert in ${place} 📉`,
        body: `Hi ${name},\n\nA property you were considering in ${place} just dropped in price. With your budget${parsed.to.budget ? ` of ${parsed.to.budget}` : ""}, this is worth a fresh look.\n\nLink + photos on WhatsApp — drop us a line on +91 70391 25391 and we'll share immediately.\n\n— Team AapKaPlot`,
      };
    case "marketing":
      return {
        subject: `Fresh property picks for ${place} — this week on AapKaPlot`,
        body: `Hi ${name},\n\nThis week's verified picks in ${place} are live. Tap below to browse, or reply with your shortlist and we'll arrange site visits.\n\nBrowse listings: https://aapkaplot.com/search\nWhatsApp: +91 70391 25391\n\nHappy hunting,\nAapKaPlot`,
      };
  }
}

export async function POST(req: Request) {
  // Admin auth — only logged-in staff drafts emails.
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const system = [
    "You are an AapKaPlot email copywriter — concise, warm, India-friendly.",
    "Output JSON with exactly two string fields: subject (≤ 70 chars) and body (≤ 220 words).",
    "Do not include placeholders like [Name] — substitute provided values; if a value is missing, write naturally without it.",
    "Sign off as 'Team AapKaPlot' unless the tone is formal.",
    "End emails with a clear next step (WhatsApp +91 70391 25391 or site link).",
    LANG_GUIDE[parsed.data.lang],
    TONE_GUIDE[parsed.data.tone],
  ].join(" ");

  const user = [
    `Purpose: ${parsed.data.purpose} — ${PURPOSE_GUIDE[parsed.data.purpose]}`,
    "Recipient: " + JSON.stringify(parsed.data.to),
    "Property context: " + JSON.stringify(parsed.data.context),
    "Respond with JSON: { \"subject\": \"...\", \"body\": \"...\" }",
  ].join("\n");

  const result = await complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.8,
    maxTokens: 500,
    responseFormat: "json",
  });

  if (!result.ok) {
    const fb = fallbackDraft(parsed.data);
    return NextResponse.json({ ...fb, source: "fallback", reason: result.reason });
  }
  try {
    const obj = JSON.parse(result.text);
    if (typeof obj.subject === "string" && typeof obj.body === "string") {
      return NextResponse.json({ subject: obj.subject, body: obj.body, source: result.source, model: result.model });
    }
  } catch { /* fall through to fallback */ }

  const fb = fallbackDraft(parsed.data);
  return NextResponse.json({ ...fb, source: "fallback", reason: "OpenAI returned non-JSON" });
}
