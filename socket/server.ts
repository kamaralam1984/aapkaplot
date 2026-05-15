/**
 * Stub for the realtime chat / lead notification server.
 *
 * This file is intentionally kept dependency-free at build time so the
 * Next.js bundle doesn't pull in `socket.io`. Wire it up later by:
 *
 *   1. npm install socket.io
 *   2. Use a custom `server.ts` (or sidecar Node process) that calls
 *      `attachSocketServer(httpServer)` after creating the HTTP server.
 *
 * Until then, the chat UI runs entirely client-side with optimistic
 * messages + spam guard.
 */
import { importOptional } from "@/lib/optional-import";

export async function attachSocketServer(httpServer: import("node:http").Server) {
  const mod = await importOptional<any>("socket.io");
  if (!mod) {
    console.warn("[socket] socket.io not installed — skipping attach");
    return null;
  }

  const { Server: IOServer } = mod;
  const io = new IOServer(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_SITE_URL ?? "*" },
    transports: ["websocket"],
  });

  const chat = io.of("/chat");
  chat.on("connection", (socket: any) => {
    socket.on("chat:join", (roomId: string) => socket.join(roomId));
    socket.on("chat:message", ({ roomId, msg }: { roomId: string; msg: unknown }) => {
      chat.to(roomId).emit("chat:message", msg);
    });
  });

  return io;
}
