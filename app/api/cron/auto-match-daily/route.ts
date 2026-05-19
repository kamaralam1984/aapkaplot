/**
 * Daily auto-match cron.
 *
 * Runs once a day (recommended 08:00 IST). For every inquiry created in the
 * last 24h that hasn't already been shortlisted, generates a fresh AI
 * shortlist and emails the admin a single digest with wa.me deep-links.
 *
 * Schedule via cron-job.org (free):
 *   GET https://aapkaplot.com/api/cron/auto-match-daily?key=$CRON_SECRET
 *
 * Auth: CRON_SECRET in `x-cron-secret` header or `?key=` query.
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { matchInquiry, type MatchResult } from "@/lib/ai/auto-match";
import { draftAutoReply, buildWaMeLink } from "@/lib/ai/auto-reply";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — AI calls are slow

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "animesh@freedomwithai.com";

function isAuthed(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    req.headers.get("x-cron-secret") === secret ||
    req.nextUrl.searchParams.get("key") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

interface DigestRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  budgetInr: bigint | null;
  message: string | null;
  matches: MatchResult[];
  waLink: string;
}

function inrShort(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

async function handle(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const leads = await prisma.inquiry.findMany({
    where: {
      createdAt: { gte: since },
      status: { in: ["new", "contacted"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // safety cap — typical day << this
  });

  const rows: DigestRow[] = [];
  let aiCalls = 0;

  for (const lead of leads) {
    const matchOut = await matchInquiry(lead, 3);
    if (matchOut.source === "openai") aiCalls++;

    // Build a short personalised WhatsApp text for the admin to forward.
    const draft = await draftAutoReply(lead, matchOut.matches, "auto_reply");
    if (draft.source === "openai") aiCalls++;

    rows.push({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      location: lead.location,
      budgetInr: lead.budgetInr,
      message: lead.message,
      matches: matchOut.matches,
      waLink: buildWaMeLink(lead.phone, draft.whatsappText),
    });

    await prisma.inquiry.update({
      where: { id: lead.id },
      data: { aiShortlistJson: matchOut.matches as unknown as object },
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, sent: false, reason: "no_new_inquiries" });
  }

  // Build the admin digest email.
  const items = rows
    .map((r) => {
      const shortlist = r.matches.length
        ? r.matches
            .map((m) => `<li><a href="${SITE}/properties/${m.propertyId}">${m.title}</a> · ${m.locality}, ${m.city} · ${inrShort(m.priceInr)} <span style="color:#64748b">(${m.score})</span></li>`)
            .join("")
        : "<li><em>No matching active listings</em></li>";
      return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
          <div style="font-weight:600">${r.name} · +91 ${r.phone}${r.email ? ` · ${r.email}` : ""}</div>
          <div style="color:#475569;font-size:13px;margin-top:3px">
            ${r.budgetInr ? inrShort(Number(r.budgetInr)) : "Budget unspecified"} · ${r.location ?? "no location"}
          </div>
          ${r.message ? `<div style="color:#334155;font-size:13px;margin-top:6px;font-style:italic">"${r.message}"</div>` : ""}
          <ul style="margin:10px 0 8px;padding-left:18px;font-size:13.5px">${shortlist}</ul>
          <a href="${r.waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:7px 14px;border-radius:8px;font-weight:600;font-size:13px;margin-top:4px">📱 WhatsApp</a>
        </div>`;
    })
    .join("");

  const html = `
    <div style="max-width:680px;margin:32px auto;font-family:system-ui,sans-serif;color:#0f172a;">
      <div style="background:linear-gradient(135deg,#10b981 0%,#6366f1 60%,#f472b6 100%);padding:20px;color:#fff;border-radius:12px 12px 0 0;">
        <div style="font-size:22px;font-weight:800;">AapKaPlot · Daily grahak digest</div>
        <div style="font-size:13px;opacity:0.9;margin-top:4px;">${rows.length} new inquiries in the last 24h · AI ranked top 3 for each</div>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 12px 12px;">
        ${items}
        <p style="color:#64748b;font-size:12px;margin-top:18px">Manage all leads: <a href="${SITE}/admin/leads">${SITE}/admin/leads</a></p>
      </div>
    </div>`;

  const txt = rows.map((r) => `${r.name} (+91 ${r.phone}) — WA: ${r.waLink}`).join("\n");

  await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `📋 Daily grahak digest · ${rows.length} new inquiries`,
    html,
    text: txt,
  });

  return NextResponse.json({ ok: true, scanned: leads.length, sent: true, aiCalls });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
