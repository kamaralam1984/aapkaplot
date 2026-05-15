/**
 * Stub for the realtime chat / lead notification server.
 * Wire up a custom Next.js server (server.ts at repo root) or a sidecar
 * Node process. Use namespaces per concern: /chat, /leads, /presence.
 */
import { Server as IOServer } from "socket.io";

export function attachSocketServer(httpServer: import("node:http").Server) {
  const io = new IOServer(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_SITE_URL ?? "*" },
    transports: ["websocket"],
  });

  const chat = io.of("/chat");
  chat.on("connection", (socket) => {
    socket.on("chat:join", (roomId: string) => socket.join(roomId));
    socket.on("chat:message", ({ roomId, msg }) => {
      chat.to(roomId).emit("chat:message", msg);
    });
  });

  return io;
}
