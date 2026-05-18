/**
 * Transactional notification helpers.
 *
 * Each function builds an email payload and hands it off to `sendEmail()`
 * from `lib/email`. When the SMTP/Resend env vars are missing, sendEmail
 * already logs to console — so calling these in production-without-SMTP
 * is harmless. Wire Resend / SendGrid by setting their env vars on the VPS.
 *
 * Every function is fire-and-forget. We never block the request that
 * triggers the notification on a slow email provider.
 */
import { sendEmail } from "@/lib/email";

interface PropertySummary {
  id: string;
  title: string;
  city: string;
  locality: string;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

function header(title: string) {
  return `
    <div style="background:linear-gradient(135deg,#10b981 0%,#6366f1 60%,#f472b6 100%);padding:20px;color:#fff;font-family:system-ui,sans-serif;border-radius:12px 12px 0 0;">
      <div style="font-size:22px;font-weight:800;">AapKaPlot</div>
      <div style="font-size:14px;opacity:0.9;margin-top:4px;">${title}</div>
    </div>
  `;
}
function shell(title: string, body: string) {
  return `
    <div style="max-width:560px;margin:32px auto;font-family:system-ui,sans-serif;color:#0f172a;">
      ${header(title)}
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;font-size:14.5px;line-height:1.55;">
        ${body}
      </div>
      <p style="color:#94a3b8;font-size:11.5px;text-align:center;margin-top:16px;">© AapKaPlot · India's verified real estate platform</p>
    </div>
  `;
}

/** Fired by /api/property/create — confirms submission. */
export function notifyListingSubmitted(to: string, property: PropertySummary) {
  return sendEmail({
    to,
    subject: `We've received your listing: ${property.title}`,
    html: shell(
      "Listing submitted for review",
      `
        <p>Hi,</p>
        <p>Thanks for posting <strong>${property.title}</strong> on AapKaPlot. Our admin team will review it within 24 hours and notify you when it goes live.</p>
        <p><a href="${SITE}/sell/listings" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">View your listings →</a></p>
      `,
    ),
    text: `Hi, we've received "${property.title}" and will review it within 24 hours. Visit ${SITE}/sell/listings`,
  });
}

/** Fired by /api/admin/properties/[id] when status flips to ACTIVE. */
export function notifyListingApproved(to: string, property: PropertySummary) {
  return sendEmail({
    to,
    subject: `Your listing is live: ${property.title}`,
    html: shell(
      "Listing approved · now live",
      `
        <p>Great news — <strong>${property.title}</strong> (${property.locality}, ${property.city}) is live on AapKaPlot.</p>
        <p>Buyers can now find it in search. Share the link to get inquiries faster.</p>
        <p>
          <a href="${SITE}/property/${property.id}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">View listing →</a>
        </p>
      `,
    ),
    text: `Your listing "${property.title}" is live: ${SITE}/property/${property.id}`,
  });
}

/** Fired by /api/lead/offer — seller gets the offer. */
export function notifyOfferReceived(to: string, property: PropertySummary, offerInr: number, buyerName: string) {
  return sendEmail({
    to,
    subject: `New offer on "${property.title}" — ₹${offerInr.toLocaleString("en-IN")}`,
    html: shell(
      `New offer received`,
      `
        <p><strong>${buyerName || "A buyer"}</strong> just submitted an offer of <strong>₹${offerInr.toLocaleString("en-IN")}</strong> on your listing <strong>${property.title}</strong>.</p>
        <p>You can accept, decline, or counter from your dashboard.</p>
        <p><a href="${SITE}/sell/leads" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">Review offer →</a></p>
      `,
    ),
    text: `New offer ₹${offerInr.toLocaleString("en-IN")} on "${property.title}". Open ${SITE}/sell/leads`,
  });
}

/** Fired by /api/lead/offer/action when seller acts. */
export function notifyOfferDecision(
  to: string,
  property: PropertySummary,
  decision: "accepted" | "declined" | "countered" | "withdrawn",
  amountInr: number,
) {
  const verb =
    decision === "accepted"  ? "accepted" :
    decision === "declined"  ? "declined" :
    decision === "countered" ? "countered" :
                                "withdrawn";
  return sendEmail({
    to,
    subject: `Your offer was ${verb} — ${property.title}`,
    html: shell(
      `Offer ${verb}`,
      `
        <p>Your offer of <strong>₹${amountInr.toLocaleString("en-IN")}</strong> on <strong>${property.title}</strong> was ${verb}.</p>
        <p><a href="${SITE}/me/offers" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">View status →</a></p>
      `,
    ),
    text: `Your offer ₹${amountInr.toLocaleString("en-IN")} on "${property.title}" was ${verb}. ${SITE}/me/offers`,
  });
}

/** Fired by /api/visit-request — seller gets the visit request. */
export function notifyVisitRequested(to: string, property: PropertySummary, visitorName: string, when: string) {
  return sendEmail({
    to,
    subject: `Visit request for "${property.title}"`,
    html: shell(
      "New visit request",
      `
        <p><strong>${visitorName || "A buyer"}</strong> wants to visit <strong>${property.title}</strong> on <strong>${when}</strong>.</p>
        <p><a href="${SITE}/me/visits" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">Manage visits →</a></p>
      `,
    ),
    text: `Visit request: ${visitorName} wants ${property.title} on ${when}. ${SITE}/me/visits`,
  });
}
