import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { subscribeMessages, type ChatMessage } from "@/lib/chat-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 15_000;

/**
 * Server-Sent Events stream of chat messages for a lead.
 *
 * Free realtime — no socket.io, no websockets, works behind any HTTP proxy.
 * Each connected client gets push events as soon as a new message is
 * published via /api/chat/[leadId]/messages POST.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ leadId: string }> }) {
  const session = await getSession();
  if (!session) return new Response("unauthenticated", { status: 401 });
  if (process.env.USE_DB !== "1") return new Response("db_disabled", { status: 503 });

  const { leadId } = await ctx.params;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { fromUserId: true, toUserId: true },
  });
  if (!lead) return new Response("not_found", { status: 404 });
  if (lead.fromUserId !== session.uid && lead.toUserId !== session.uid) {
    return new Response("forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed; cleanup runs from cancel()
        }
      };

      // Open + heartbeat keeps proxies happy.
      send("ready", { leadId });
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_MS);

      const unsubscribe = subscribeMessages(leadId, (msg: ChatMessage) => {
        send("message", { ...msg, fromMe: msg.fromUserId === session.uid });
      });

      // @ts-expect-error attach for cancel()
      controller._cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel(reason) {
      // @ts-expect-error read back the closure we attached above
      this._cleanup?.();
      void reason;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
