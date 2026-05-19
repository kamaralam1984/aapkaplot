/**
 * Auto-reply library — drafts a personalised email + WhatsApp message
 * for a new grahak inquiry, optionally referencing top shortlisted listings.
 *
 * Used by:
 *   • POST /api/lead/inquiry — instant auto-reply on form submit
 *   • Cron /api/cron/auto-followup — 3-day silent grahak nudge
 *
 * Falls back to a clean templated draft when OPENAI_API_KEY absent.
 */

import type { Inquiry } from "@prisma/client";
import { complete } from "@/lib/ai/openai";
import type { MatchResult } from "@/lib/ai/auto-match";
import { chinkkiSystem } from "@/lib/ai/persona";

export type ReplyKind = "auto_reply" | "followup";

export interface DraftedReply {
  emailSubject: string;
  emailBody: string;        // plain text — wrap in shell() at send time
  whatsappText: string;     // ≤ 600 chars, includes shortlist if any
  source: "openai" | "fallback";
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

function inrShort(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function shortlistLines(matches: MatchResult[]): string {
  if (!matches.length) return "";
  return matches
    .map((m, i) => `${i + 1}. ${m.title} · ${m.locality}, ${m.city} · ${inrShort(m.priceInr)}\n   ${SITE}/properties/${m.propertyId}`)
    .join("\n");
}

export async function draftAutoReply(
  lead: Pick<Inquiry, "name" | "phone" | "email" | "budgetInr" | "location" | "message" | "createdAt">,
  matches: MatchResult[],
  kind: ReplyKind = "auto_reply",
): Promise<DraftedReply> {
  const budget = lead.budgetInr ? inrShort(Number(lead.budgetInr)) : null;
  const place = lead.location || "your area";
  const firstName = (lead.name || "there").split(/\s+/)[0];

  const matchBlock = shortlistLines(matches);

  // Build the Chinkki-flavoured system prompt. Per-task rules go in extras.
  const system =
    kind === "auto_reply"
      ? chinkkiSystem([
          `Naye grahak ki property inquiry ka SHORT, narm acknowledgement likhein.`,
          `Unke budget/location ko zaroor zikr karein. Agar shortlist diya gaya hai to 1-2 listings ko muhabbat se mention karein.`,
          `Aakhir mein narm tareeke se kahein: WhatsApp +91 70391 25391 par baat karein ya is email ka jawab dein.`,
          `Strict JSON return karein: { "subject": string, "email": string, "whatsapp": string }`,
          `subject: 6-10 alfaaz, dil ko chhune wala (e.g. "Aapki inquiry mil gayi — Chinkki yahaan hai").`,
          `email: 5-8 chhoti lines, plain text. Shuru mein "${firstName} ji" se shuru karein.`,
          `whatsapp: ≤ 480 characters, dosti bhare lehje mein, 1-2 listing URLs agar shortlist diya hai.`,
          `Plot/property ka fayda, nearby amenity, aur future growth me se kam se kam 1 baat zaroor chhuiye.`,
        ])
      : chinkkiSystem([
          `3 din se khaamosh grahak ke liye SHORT, narm followup likhein.`,
          `Pehle hi line mein narmi se acknowledge karein ki "shayad aap busy honge".`,
          `Unke budget/location pe reference dein. Agar shortlist diya hai to 1-2 fresh options pesh karein.`,
          `Aage badhne ke 3 aasaan raaste sujhaayein: WhatsApp, site-visit, ya seedha reply.`,
          `Strict JSON return karein: { "subject": string, "email": string, "whatsapp": string }`,
          `subject: 6-10 alfaaz, soft (e.g. "${firstName} ji, ek pyaar bhari yaad-dehani").`,
          `email: 5-8 chhoti lines, plain text.`,
          `whatsapp: ≤ 480 characters.`,
          `Is baar khaas tor par nearby development ya upcoming feature ka zikr karein — taa-ke grahak ko lage ki yeh ilaaqa bahut khaas hai.`,
        ]);

  const user = [
    `Grahak name: ${lead.name}`,
    `Phone: +91 ${lead.phone}`,
    budget ? `Budget: ${budget}` : "Budget: unspecified",
    `Location: ${place}`,
    lead.message ? `Their message: "${lead.message}"` : "Their message: (none)",
    matchBlock ? `Shortlist:\n${matchBlock}` : "Shortlist: (none — we'll send curated picks within 24h)",
  ].join("\n");

  const r = await complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.55,
    maxTokens: 500,
    responseFormat: "json",
  });

  if (r.ok) {
    try {
      const parsed = JSON.parse(r.text) as { subject?: string; email?: string; whatsapp?: string };
      if (parsed.subject && parsed.email && parsed.whatsapp) {
        return {
          emailSubject: parsed.subject.slice(0, 140),
          emailBody: parsed.email.trim(),
          whatsappText: parsed.whatsapp.slice(0, 600),
          source: "openai",
        };
      }
    } catch { /* fall through */ }
  }

  // ── Deterministic fallback (Chinkki persona) ────────────────────────
  const subject =
    kind === "auto_reply"
      ? `${firstName} ji, aapki inquiry mil gayi — Chinkki yahaan hai 🌸`
      : `${firstName} ji, ek pyaar bhari yaad-dehani aapke liye`;

  const opener =
    kind === "auto_reply"
      ? `Aapne AapKaPlot par sampark kiya — bahut shukriya. Maine aapki zaroorat note kar li hai${budget ? ` (budget ${budget})` : ""}${lead.location ? ` aur ${lead.location} ke aas-paas` : ""}.`
      : `Umeed hai aap khairiyat se hain. Aapke property safar par naazren rakhe hue hoon${lead.location ? ` — ${lead.location} mein` : ""}${budget ? ` ${budget} ke aas-paas` : ""}. Kya abhi bhi dhoondh rahe hain?`;

  const middle = matchBlock
    ? `Aapke liye chand khaas options chuni hain:\n${matchBlock}\n\nYeh saari properties verified hain aur achi locality mein hain — paani, bijli, sadak sab achi.`
    : `Hamari team aapke liye verified listings tayyar kar rahi hai. 24 ghante mein khaas shortlist aapke paas pahunch jayegi.`;

  const close = `Jab bhi mauka mile, WhatsApp +91 70391 25391 par hum baat kar sakte hain, ya seedha is email ka jawab dein. Site-visit bhi arrange ho jayega.\n\nMuhabbat ke saath,\n— Chinkki, AapKaPlot`;

  const emailBody = `${firstName} ji,\n\n${opener}\n\n${middle}\n\n${close}`;

  const wa = [
    `${firstName} ji 🌸 ${kind === "auto_reply" ? "Aapki AapKaPlot inquiry mil gayi" : "Aapke property safar par chand din baad yaad-dehani"}${lead.location ? `, ${lead.location} ke liye` : ""}${budget ? ` (${budget} budget)` : ""}.`,
    matchBlock ? `\n\nChand options:\n${matchBlock}\n\nSab verified, achi locality.` : `\n\n24 ghante mein verified shortlist bhej rahi hoon.`,
    `\n\nKabhi bhi reply karein — site-visit bhi arrange ho jayega. — Chinkki, AapKaPlot`,
  ].join("");

  return {
    emailSubject: subject,
    emailBody,
    whatsappText: wa.slice(0, 600),
    source: "fallback",
  };
}

/**
 * Build a wa.me deep-link the admin can tap to send the drafted WhatsApp
 * to the grahak. Free — no WhatsApp Business API needed.
 */
export function buildWaMeLink(grahakPhone10: string, message: string): string {
  const cc = "91";
  const phone = grahakPhone10.replace(/\D/g, "").slice(-10);
  return `https://wa.me/${cc}${phone}?text=${encodeURIComponent(message)}`;
}
