import { Hono } from "hono";
import { db } from "../db/index.js";

export const health = new Hono();

health.get("/", async (c) => {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await db.execute("select 1");
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  return c.json({
    status: dbOk ? "ok" : "degraded",
    service: "chainmail-api",
    version: "0.1.0",
    uptime: Math.round(process.uptime()),
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    requestLatencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
});
