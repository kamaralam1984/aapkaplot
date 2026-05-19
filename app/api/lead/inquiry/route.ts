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
import { matchInquiry } from "@/lib/ai/auto-match";
import { draftAutoReply, buildWaMeLink } from "@/lib/ai/auto-reply";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "animesh@freedomwithai.com";

function shellHtml(title: string, body: string) {
  return `
    <div style="max-width:560px;margin:32px auto;font-family:system-ui,sans-serif;color:#0f172a;">
      <div style="background:linear-gradient(135deg,#10b981 0%,#6366f1 60%,#f472b6 100%);padding:20px;color:#fff;border-radius:12px 12px 0 0;">
        <div style="font-size:22px;font-weight:800;">AapKaPlot</div>
        <div style="font-size:14px;opacity:0.9;margin-top:4px;">${title}</div>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;font-size:14.5px;line-height:1.55;">
        ${body}
      </div>
    </div>`;
}

async function processAutoReply(inquiryId: string): Promise<void> {
  try {
    const lead = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!lead || lead.autoReplySentAt) return;

    const matchOut = await matchInquiry(lead, 3);
    const draft = await draftAutoReply(lead, matchOut.matches, "auto_reply");
    const waLink = buildWaMeLink(lead.phone, draft.whatsappText);

    // 1. Send the auto-reply to the grahak if we have their email.
    if (lead.email) {
      await sendEmail({
        to: lead.email,
        subject: draft.emailSubject,
        html: shellHtml("Thanks for your inquiry", draft.emailBody.replace(/\n/g, "<br>")),
        text: draft.emailBody,
      });
    }

    // 2. Notify admin with the wa.me link + shortlist so they can hit send in one tap.
    const shortlistHtml = matchOut.matches.length
      ? matchOut.matches
          .map((m) => `<li><a href="${SITE}/properties/${m.propertyId}">${m.title}</a> · ${m.locality}, ${m.city} · ₹${m.priceInr.toLocaleString("en-IN")} <span style="color:#64748b">(score ${m.score})</span><br><span style="color:#475569;font-size:13px">${m.reason}</span></li>`)
          .join("")
      : "<li><em>No active listings matched — review manually.</em></li>";

    const adminBody = `
      <p><strong>New grahak inquiry · auto-reply ${draft.source === "openai" ? "sent (AI)" : "sent (template fallback)"}</strong></p>
      <p><strong>${lead.name}</strong> · +91 ${lead.phone}${lead.email ? ` · ${lead.email}` : ""}<br>
      Budget: ${lead.budgetInr ? `₹${Number(lead.budgetInr).toLocaleString("en-IN")}` : "unspecified"} · Location: ${lead.location ?? "—"}<br>
      Message: ${lead.message ? `"${lead.message}"` : "—"}</p>

      <p><a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">📱 Send WhatsApp to grahak</a></p>

      <p style="margin-top:18px"><strong>AI shortlist:</strong></p>
      <ol style="padding-left:18px">${shortlistHtml}</ol>

      <p style="color:#64748b;font-size:12px;margin-top:18px">Open in admin: <a href="${SITE}/admin/leads">${SITE}/admin/leads</a></p>`;

    await sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `🆕 ${lead.name} · ${lead.location ?? "no-location"}${lead.budgetInr ? ` · ${Math.round(Number(lead.budgetInr) / 100_000)}L` : ""}`,
      html: shellHtml("New inquiry · AI auto-replied", adminBody),
      text: `New inquiry from ${lead.name} (+91 ${lead.phone}). WhatsApp draft: ${waLink}`,
    });

    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        autoReplySentAt: new Date(),
        aiReplyDraft: JSON.stringify({ subject: draft.emailSubject, email: draft.emailBody, whatsapp: draft.whatsappText, source: draft.source }),
        aiShortlistJson: matchOut.matches as unknown as object,
      },
    });
  } catch (err) {
    console.error("[inquiry] auto_reply_failed", err);
  }
}

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

  let created;
  try {
    created = await prisma.inquiry.create({
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

  // Fire-and-forget AI auto-reply. Never block the grahak's form submit on
  // OpenAI / SMTP latency — failures are logged, not surfaced.
  void processAutoReply(created.id);

  return NextResponse.json({ ok: true });
}
