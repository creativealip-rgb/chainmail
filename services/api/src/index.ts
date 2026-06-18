/**
 * Chainmail API — Hono entry
 * Default port 3000. Bind 0.0.0.0 for Docker.
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { health } from "./routes/health.js";
import { auth } from "./routes/auth.js";
import { aliases } from "./routes/aliases.js";
import { errorHandler } from "./middleware/error.js";
import type { ChainmailVars } from "./middleware/auth.js";

const app = new Hono<{ Variables: ChainmailVars }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["https://chainmail.168-144-37-19.sslip.io", "http://localhost:5173"],
    credentials: true,
  })
);

app.onError(errorHandler);

app.route("/api/health", health);
app.route("/api/auth", auth);
app.route("/api/aliases", aliases);

app.get("/", (c) => c.text("chainmail-api · see /api/health"));

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`[chainmail-api] listening on :${info.port}`);
});
