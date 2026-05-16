/**
 * Tiny transactional email helper.
 *
 * Sends via Resend's REST API (free tier: 3,000/month, 100/day) when
 * RESEND_API_KEY is set. Falls back to console logging in dev so the OTP
 * flow keeps working without a configured provider.
 *
 * No SDK dependency — uses plain fetch().
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM_DEFAULT = "AapKaPlot <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ ok: boolean; via: "resend" | "console"; id?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? FROM_DEFAULT;

  if (!key) {
    console.log(`[email:console] to=${to} subject="${subject}"`);
    if (text) console.log(`[email:console] ${text}`);
    return { ok: true, via: "console" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[email:resend] HTTP ${res.status} ${body.slice(0, 200)}`);
      return { ok: false, via: "resend" };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, via: "resend", id: data.id };
  } catch (err) {
    console.warn("[email:resend] threw:", (err as Error).message);
    return { ok: false, via: "resend" };
  }
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
        <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;border-top:1px solid #e2e8f0;padding-top:12px">— AapKaPlot · 8rupiya.in</p>
      </div>
    `,
  };
}
