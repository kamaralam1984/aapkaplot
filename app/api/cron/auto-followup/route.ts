/**
 * 3-day silent-grahak auto-followup cron.
 *
 * Runs once a day (recommended 10:00 IST). Targets inquiries:
 *   • status = "new" (never marked contacted in admin)
 *   • createdAt < now - 3 days
 *   • lastFollowupAt is null OR < now - 3 days
 *   • followupCount < 2  (max 2 followups — never spam)
 *
 * Each target gets a fresh AI-drafted followup:
 *   • If grahak has email → email is sent automatically
 *   • Admin always gets a wa.me deep-link to forward on WhatsApp
 *
 * Schedule via cron-job.org (free):
 *   GET https://aapkaplot.com/api/cron/auto-followup?key=$CRON_SECRET
 *
 * Auth: CRON_SECRET in `x-cron-secret` header or `?key=` query.
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { matchInquiry } from "@/lib/ai/auto-match";
import { draftAutoReply, buildWaMeLink } from "@/lib/ai/auto-reply";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "animesh@freedomwithai.com";
const MAX_PER_RUN = 20; // safety cap

function isAuthed(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    req.headers.get("x-cron-secret") === secret ||
    req.nextUrl.searchParams.get("key") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

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

async function handle(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const targets = await prisma.inquiry.findMany({
    where: {
      status: "new",
      createdAt: { lt: threeDaysAgo },
      followupCount: { lt: 2 },
      OR: [
        { lastFollowupAt: null },
        { lastFollowupAt: { lt: threeDaysAgo } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  if (targets.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, processed: 0, reason: "no_silent_grahaks" });
  }

  const adminBlocks: string[] = [];
  let emailedGrahaks = 0;

  for (const lead of targets) {
    const matchOut = await matchInquiry(lead, 2);
    const draft = await draftAutoReply(lead, matchOut.matches, "followup");
    const waLink = buildWaMeLink(lead.phone, draft.whatsappText);

    // Send followup email directly to grahak if we have their address.
    if (lead.email) {
      try {
        await sendEmail({
          to: lead.email,
          subject: draft.emailSubject,
          html: shellHtml("Quick followup", draft.emailBody.replace(/\n/g, "<br>")),
          text: draft.emailBody,
        });
        emailedGrahaks++;
      } catch (err) {
        console.error("[auto-followup] grahak_email_failed", lead.id, err);
      }
    }

    // Mark followup attempted regardless of email delivery (admin still gets wa.me).
    await prisma.inquiry.update({
      where: { id: lead.id },
      data: {
        lastFollowupAt: new Date(),
        followupCount: { increment: 1 },
        aiShortlistJson: matchOut.matches as unknown as object,
      },
    });

    const shortlist = matchOut.matches.length
      ? matchOut.matches
          .map((m) => `<li><a href="${SITE}/properties/${m.propertyId}">${m.title}</a> · ${m.locality} · ₹${m.priceInr.toLocaleString("en-IN")}</li>`)
          .join("")
      : "<li><em>No fresh listings — manual reachout suggested</em></li>";

    adminBlocks.push(`
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-weight:600">${lead.name} · +91 ${lead.phone}${lead.email ? ` ✉ emailed` : " (no email — WA only)"}</div>
        <div style="color:#475569;font-size:13px;margin-top:3px">
          Created ${lead.createdAt.toISOString().slice(0, 10)} · ${lead.location ?? "no location"} · followup #${lead.followupCount + 1}
        </div>
        <ul style="margin:10px 0 8px;padding-left:18px;font-size:13.5px">${shortlist}</ul>
        <a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:7px 14px;border-radius:8px;font-weight:600;font-size:13px">📱 Send WhatsApp followup</a>
      </div>`);
  }

  // Send admin a single digest of all followups attempted this run.
  await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `🔁 ${targets.length} grahak followup${targets.length > 1 ? "s" : ""} · ${emailedGrahaks} auto-emailed`,
    html: shellHtml(`${targets.length} silent grahak followups`, adminBlocks.join("")),
    text: `${targets.length} followups attempted. ${emailedGrahaks} emailed automatically.`,
  });

  return NextResponse.json({
    ok: true,
    scanned: targets.length,
    emailedGrahaks,
    processed: targets.length,
  });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
