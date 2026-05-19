/**
 * Tiny transactional email helper.
 *
 * Delivery order:
 *   1. Resend REST API   (free 3,000/mo, 100/day; needs verified domain
 *      to send to arbitrary recipients).
 *   2. SMTP via nodemailer  (Gmail App Password works; unlimited recipients
 *      but rate-limited by Gmail).
 *   3. Console log         (dev fallback so OTPs keep flowing).
 *
 * Each step is tried only when the previous one isn't configured OR fails.
 */
import nodemailer from "nodemailer";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Resend free plan only allows one verified domain on this account, and that
// slot is held by vidyt.com. Until aapkaplot.com is verified (separate Resend
// account / plan upgrade / different provider), send from the already-verified
// vidyt.com mailbox. The display name keeps the brand correct in inboxes.
const FROM_DEFAULT = "AapKaPlot <noreply@vidyt.com>";

// Older deploys still have EMAIL_FROM=...onboarding@resend.dev in their
// .env.local — that sender is sandbox-only and rejects every recipient
// except the Resend account owner. Treat it as unset so we fall back to
// the verified default above.
const BROKEN_FROM_PATTERNS = [/onboarding@resend\.dev/i];

type Via = "resend" | "smtp" | "console";

let smtpTransport: nodemailer.Transporter | null = null;
function getSmtp(): nodemailer.Transporter | null {
  if (smtpTransport) return smtpTransport;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  smtpTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  });
  return smtpTransport;
}

async function sendViaResend(args: SendArgs, from: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "no_key" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html, text: args.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `http_${res.status} ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function sendViaSmtp(args: SendArgs, from: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const tx = getSmtp();
  if (!tx) return { ok: false, error: "no_smtp_config" };

  // Gmail SMTP rewrites/rejects when the From address doesn't match the
  // authenticated user. Force the From mailbox to SMTP_USER but keep the
  // display name, so the inbox shows "AapKaPlot <noreply@aapkaplot.com>".
  const smtpUser = process.env.SMTP_USER;
  let envelopeFrom = from;
  if (smtpUser) {
    const displayMatch = from.match(/^([^<]+?)\s*</);
    const display = (displayMatch?.[1] ?? "AapKaPlot").trim();
    envelopeFrom = `${display} <${smtpUser}>`;
  }

  try {
    const info = await tx.sendMail({
      from: envelopeFrom,
      replyTo: from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; via: Via; id?: string; error?: string }> {
  const rawFrom = process.env.EMAIL_FROM;
  const from =
    rawFrom && !BROKEN_FROM_PATTERNS.some((p) => p.test(rawFrom))
      ? rawFrom
      : FROM_DEFAULT;
  const errors: string[] = [];

  // 1. Try Resend.
  if (process.env.RESEND_API_KEY) {
    const r = await sendViaResend(args, from);
    if (r.ok) {
      console.log(`[email:resend] sent to=${args.to} id=${r.id}`);
      return { ok: true, via: "resend", id: r.id };
    }
    console.warn(`[email:resend] failed (${r.error}) — falling back to SMTP`);
    errors.push(`resend:${r.error}`);
  }

  // 2. Try SMTP.
  if (process.env.SMTP_HOST) {
    const s = await sendViaSmtp(args, from);
    if (s.ok) {
      console.log(`[email:smtp] sent to=${args.to} id=${s.id}`);
      return { ok: true, via: "smtp", id: s.id };
    }
    console.warn(`[email:smtp] failed (${s.error}) — falling back to console`);
    errors.push(`smtp:${s.error}`);
  }

  // 3. Console fallback — only acceptable in non-production. In production
  // surface as a hard failure so the API can tell the user their OTP didn't
  // actually leave the server (instead of silently lying with ok:true).
  if (process.env.NODE_ENV === "production") {
    console.error(`[email] all providers failed for to=${args.to}: ${errors.join(" | ")}`);
    return { ok: false, via: "console", error: errors.join(" | ") || "no_provider_configured" };
  }
  console.log(`[email:console] to=${args.to} subject="${args.subject}"`);
  if (args.text) console.log(`[email:console] ${args.text}`);
  return { ok: true, via: "console" };
}

/** Pre-built template for the 6-digit login OTP. */
export function otpEmailContent(code: string): { subject: string; html: string; text: string } {
  return {
    subject: `Your AapKaPlot login code: ${code}`,
    text: `Your AapKaPlot login code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:22px;margin:0 0 8px">Your login code</h1>
        <p style="color:#475569;margin:0 0 24px">Enter this code in your browser to sign in.</p>
        <div style="background:#ecfdf5;border:1px solid #10b981;border-radius:12px;padding:18px;text-align:center;font-size:30px;font-weight:800;letter-spacing:8px;color:#065f46">${code}</div>
        <p style="color:#64748b;font-size:13px;margin:20px 0 0">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
        <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;border-top:1px solid #e2e8f0;padding-top:12px">— AapKaPlot · aapkaplot.com</p>
      </div>
    `,
  };
}
