/**
 * Realtime — Socket.IO server mounted on the same HTTP server as Hono.
 *
 * Auth: client sends `{ auth: { token } }` (matches `connectSocket` in web).
 *       JWT verified via `verifyAccessToken`. On success, socket joins room
 *       `user:${userId}`.
 *
 * Events emitted by server:
 *   - `message.created` → { messageId, aliasId, from, subject, receivedAt, hasReceipt }
 *
 * Usage from a route:
 *   import { emitToUser } from "../lib/realtime.js";
 *   emitToUser(userId, "message.created", payload);
 */
import type { Server as HttpServer } from "node:http";
import { Server as IOServer, type Socket } from "socket.io";
import { verifyAccessToken } from "./jwt.js";

let io: IOServer | null = null;

export function attachRealtime(httpServer: HttpServer): IOServer {
  if (io) return io;

  io = new IOServer(httpServer, {
    path: "/engine.io",
    cors: {
      origin: [
        "https://chainmail.168-144-37-19.sslip.io",
        "http://localhost:5173",
      ],
      credentials: true,
    },
    // JWT handshake — fail fast, don't waste a round-trip
    allowEIO3: false,
  });

  // Auth middleware: reject connections without a valid Bearer JWT
  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth as { token?: unknown })?.token;
      if (typeof token !== "string" || !token) {
        return next(new Error("missing_token"));
      }
      const payload = await verifyAccessToken(token);
      // Stash userId on the socket for room routing
      (socket.data as { userId: string }).userId = payload.sub;
      next();
    } catch (e) {
      next(new Error(e instanceof Error ? e.message : "invalid_token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket.data as { userId: string }).userId;
    const room = `user:${userId}`;
    socket.join(room);
    console.log(`[ws] connect user=${userId} sid=${socket.id} room=${room}`);

    socket.on("disconnect", (reason) => {
      console.log(`[ws] disconnect user=${userId} sid=${socket.id} reason=${reason}`);
    });
  });

  console.log("[ws] socket.io attached at /engine.io");
  return io;
}

/** Emit an event to a specific user's room (no-op if io not initialized). */
export function emitToUser<T = unknown>(
  userId: string,
  event: string,
  payload: T
): void {
  if (!io) {
    // Server not in WS mode (e.g. unit tests, ingestion worker without HTTP).
    // Silently skip — the REST response still carries the data.
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}

/** Test helper — returns the io instance if attached. */
export function getIO(): IOServer | null {
  return io;
}