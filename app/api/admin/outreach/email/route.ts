import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";

async function adminGuard() {
  const session = await getSession();
  if (!session) return { session: null, err: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!isAdminRole(session.role)) return { session: null, err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, err: null };
}

async function callGroq(prompt: string): Promise<{ subject: string; bodyHtml: string; bodyText: string } | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { err } = await adminGuard();
  if (err) return err;

  const body = await req.json().catch(() => null);
  const { prospectId, templateType = "intro" } = body ?? {};

  if (!prospectId) {
    return NextResponse.json({ error: "prospectId is required" }, { status: 400 });
  }

  if (process.env.USE_DB !== "1") {
    return NextResponse.json({ ok: true, subject: "Demo email (DB disabled)", prospectId });
  }

  const prospect = await prisma.outreachProspect.findUnique({ where: { id: prospectId } });
  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  if (prospect.status === "unsubscribed") {
    return NextResponse.json({ error: "Prospect has unsubscribed" }, { status: 400 });
  }

  const templateHint =
    templateType === "hot"
      ? "They are a high-interest hot prospect. Be more direct about the value and offer a quick call."
      : templateType === "followup"
      ? "This is a follow-up email. Reference that we reached out before and keep it brief."
      : "This is an introduction email. Be warm and not pushy.";

  const prompt = `Write a short, personal, non-spammy cold email in Hinglish (mix of Hindi and English, friendly tone) from AapKaPlot team to ${prospect.ownerName ?? prospect.businessName}, a ${prospect.businessType} in ${prospect.city} with ${prospect.listingCount} listings.
${templateHint}
Offer: Free listing + AI-powered leads + verified badge + promotional placement.
Plans: ₹999/month Basic, ₹4999/month Pro, ₹25000/month City Sponsor.
Keep the email under 150 words. Sound human, not like a robot.
Return JSON only: { "subject": "string", "bodyHtml": "string (clean HTML, basic formatting only, no inline styles except <b> <br> <p>)", "bodyText": "string" }`;

  const emailData = await callGroq(prompt);

  const subject = emailData?.subject ?? `AapKaPlot par apni properties list karein — ${prospect.city}`;
  const bodyHtml =
    emailData?.bodyHtml ??
    `<p>Namaste ${prospect.ownerName ?? prospect.businessName} ji,</p><p>AapKaPlot par apni properties list karein aur AI-powered leads paayein. Plans ₹999/month se shuru hote hain.</p><p>Reply karein ya <a href="https://aapkaplot.com">aapkaplot.com</a> visit karein.</p><p>Regards,<br>AapKaPlot Team</p>`;
  const bodyText =
    emailData?.bodyText ??
    `Namaste ${prospect.ownerName ?? prospect.businessName} ji, AapKaPlot par apni properties list karein. Plans ₹999/month se shuru. aapkaplot.com`;

  const unsubscribeLink = `https://aapkaplot.com/api/unsubscribe?id=${prospect.id}`;
  const finalHtml = `${bodyHtml}<br><br><small style="color:#999">You received this because you are a real estate professional. <a href="${unsubscribeLink}" style="color:#999">Unsubscribe</a></small>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `AapKaPlot Team <${process.env.EMAIL_FROM ?? "team@aapkaplot.com"}>`,
      to: [prospect.email],
      subject,
      html: finalHtml,
      text: bodyText,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text().catch(() => "unknown");
    return NextResponse.json({ error: `Resend error: ${errBody}` }, { status: 502 });
  }

  await prisma.outreachProspect.update({
    where: { id: prospectId },
    data: { emailSentAt: new Date(), status: "emailed" },
  });

  return NextResponse.json({ ok: true, subject, prospectId });
}
