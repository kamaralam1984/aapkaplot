/**
 * In-process pub/sub for chat messages. Each leadId is a channel.
 *
 * Free, dependency-free realtime: SSE consumers in /api/chat/[leadId]/stream
 * subscribe here; the POST messages route publishes here after persisting.
 *
 * Single-Node only — for multi-instance VPS deploys swap with Redis pub/sub
 * (REDIS_URL is already in env). The interface stays identical.
 */
import { EventEmitter } from "node:events";

export interface ChatMessage {
  id: string;
  leadId: string;
  fromUserId: string;
  body: string;
  createdAt: string;
}

declare global {
  // Keep a single bus across hot reloads in dev.
  var __chatBus: EventEmitter | undefined;
}

const bus: EventEmitter = globalThis.__chatBus ?? new EventEmitter();
bus.setMaxListeners(1000);
if (process.env.NODE_ENV !== "production") {
  globalThis.__chatBus = bus;
}

const eventName = (leadId: string) => `chat:${leadId}`;

export function publishMessage(msg: ChatMessage): void {
  bus.emit(eventName(msg.leadId), msg);
}

export function subscribeMessages(
  leadId: string,
  handler: (msg: ChatMessage) => void
): () => void {
  const name = eventName(leadId);
  bus.on(name, handler);
  return () => bus.off(name, handler);
}
