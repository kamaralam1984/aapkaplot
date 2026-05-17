/**
 * Web push helper — wraps the `web-push` library.
 *
 * Free: VAPID auth (self-generated), no third-party service.
 *
 * Generate keys once:
 *   npx web-push generate-vapid-keys
 *
 * Then drop them into .env:
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:you@aapkaplot.com
 *
 * When any are missing, sendPush() becomes a no-op (logs to console).
 */
import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { prisma } from "@/server/db";

const PUBLIC = process.env.VAPID_PUBLIC_KEY?.trim();
const PRIVATE = process.env.VAPID_PRIVATE_KEY?.trim();
const SUBJECT = process.env.VAPID_SUBJECT?.trim() ?? "mailto:noreply@aapkaplot.com";

let configured = false;
function configure() {
  if (configured) return;
  if (PUBLIC && PRIVATE) {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
    configured = true;
  }
}

export const VAPID_PUBLIC_KEY = PUBLIC ?? "";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

/**
 * Send to a single subscription. Cleans up stale subs (404/410) by deleting
 * from DB so we don't keep retrying.
 */
export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ ok: boolean; reason?: string }> {
  configure();
  if (!configured) {
    console.log(`[push:noop] ${payload.title} → ${sub.endpoint.slice(0, 40)}…`);
    return { ok: false, reason: "no_vapid" };
  }

  const subscription: WebPushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      // Subscription expired — drop it.
      await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
      return { ok: false, reason: "expired_pruned" };
    }
    console.warn("[push] send_failed", status, (err as Error).message);
    return { ok: false, reason: `http_${status ?? "err"}` };
  }
}

/** Send to every subscription owned by a user. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let delivered = 0;
  for (const s of subs) {
    const r = await sendPush(s, payload);
    if (r.ok) delivered++;
  }
  return delivered;
}
