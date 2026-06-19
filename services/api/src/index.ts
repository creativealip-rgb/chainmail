/**
 * Chainmail API — Hono entry
 * Default port 3000. Bind 0.0.0.0 for Docker.
 *
 * W5.2: Socket.IO mounted on the same HTTP server at /engine.io.
 *        Ingestion emits `message.created` to the recipient user's room.
 */
import { createServer } from "node:http";
import { getRequestListener } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { health } from "./routes/health.js";
import { auth } from "./routes/auth.js";
import { aliases } from "./routes/aliases.js";
import { ingestRoute } from "./routes/ingest.js";
import { messagesRoute } from "./routes/messages.js";
import { foldersRoute } from "./routes/folders.js";
import { ledgerRoute } from "./routes/ledger.js";
import { errorHandler } from "./middleware/error.js";
import { attachRealtime } from "./lib/realtime.js";
import type { ChainmailVars } from "./middleware/auth.js";

const app = new Hono<{ Variables: ChainmailVars }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "https://chainmail.168-144-37-19.sslip.io",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.onError(errorHandler);

app.route("/api/health", health);
app.route("/api/auth", auth);
app.route("/api/aliases", aliases);
app.route("/api/ingest", ingestRoute);
// messagesRoute now mounts both /api/messages and /api/receipts
app.route("/api", messagesRoute);
// foldersRoute mounts /api/folders, /api/labels, /api/messages/:id, /api/messages/:id/labels
app.route("/api", foldersRoute);
// ledgerRoute mounts /api/ledger/:year — tax-year rollup
app.route("/api", ledgerRoute);

app.get("/", (c) => c.text("chainmail-api · see /api/health"));

const port = Number(process.env.PORT ?? 3000);
const hostname = "0.0.0.0";

// W5.2: one HTTP server, shared between Hono and Socket.IO.
// `getRequestListener` adapts Node IncomingMessage → Web Request for Hono
// (Hono's CORS/logger/etc. middleware call `req.headers.get(...)`).
const httpServer = createServer();

// Hono handles HTTP requests (Node IncomingMessage → Web Request → Response).
httpServer.on("request", getRequestListener(app.fetch));

// Socket.IO handles WS upgrades + /engine.io polling on the same server.
attachRealtime(httpServer);

httpServer.listen(port, hostname, () => {
  console.log(`[chainmail-api] listening on ${hostname}:${port}`);
});