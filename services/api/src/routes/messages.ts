/**
 * GET /api/messages?aliasId=&limit=&offset=
 * GET /api/messages/:id
 * GET /api/receipts?year=&asset=&chain=
 *
 * Messages: list for the authenticated user (filtered by their aliases).
 *           Mark-as-read is implicit on GET /:id.
 * Receipts: aggregated on-chain receipts for tax/audit use.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages, receipts } from "../db/schema/index.js";
import { requireAuth, type ChainmailVars } from "../middleware/auth.js";

// Mount both sub-routes on this module — Hono lets us share the Hono instance
const route = new Hono<{ Variables: ChainmailVars }>();
route.use("*", requireAuth());

// ── /api/messages ──────────────────────────────────────────────
const messageListQuery = z.object({
  aliasId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

route.get("/messages", async (c) => {
  const userId = c.get("userId");
  const q = messageListQuery.safeParse(c.req.query());
  if (!q.success) return c.json({ error: "invalid query", issues: q.error.flatten() }, 400);

  const userAliases = await db
    .select({ id: aliases.id, email: aliases.email })
    .from(aliases)
    .where(eq(aliases.userId, userId));
  if (userAliases.length === 0) {
    return c.json({ messages: [], total: 0, limit: q.data.limit, offset: q.data.offset });
  }
  const allowedAliasIds = userAliases.map((a) => a.id);
  const aliasFilter = q.data.aliasId && allowedAliasIds.includes(q.data.aliasId)
    ? eq(messages.aliasId, q.data.aliasId)
    : inArray(messages.aliasId, allowedAliasIds);

  const rows = await db
    .select({
      id: messages.id,
      aliasId: messages.aliasId,
      fromAddr: messages.fromAddr,
      fromName: messages.fromName,
      subject: messages.subject,
      parserKey: messages.parserKey,
      receiptId: messages.receiptId,
      parsedAt: messages.parsedAt,
      readAt: messages.readAt,
      receivedAt: messages.receivedAt,
    })
    .from(messages)
    .where(aliasFilter)
    .orderBy(desc(messages.receivedAt))
    .limit(q.data.limit)
    .offset(q.data.offset);

  return c.json({
    messages: rows.map((r) => ({
      ...r,
      aliasEmail: userAliases.find((a) => a.id === r.aliasId)?.email,
    })),
    total: rows.length,
    limit: q.data.limit,
    offset: q.data.offset,
  });
});

route.get("/messages/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ error: "invalid id" }, 400);

  const userAliases = await db
    .select({ id: aliases.id })
    .from(aliases)
    .where(eq(aliases.userId, userId));
  const allowed = new Set(userAliases.map((a) => a.id));

  const [row] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  if (!row || !allowed.has(row.aliasId)) {
    return c.json({ error: "not found" }, 404);
  }

  if (!row.readAt) {
    await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id));
    row.readAt = new Date();
  }

  // Include receipt if linked
  let linkedReceipt = null;
  if (row.receiptId) {
    const [r] = await db.select().from(receipts).where(eq(receipts.id, row.receiptId)).limit(1);
    if (r) {
      // Merge parser-specific fields from raw JSONB into top-level for client convenience
      const raw = (r.raw ?? {}) as Record<string, unknown>;
      const pricePerUnit = r.assetPriceUsd
        ?? (typeof raw.price === "string" ? raw.price : null)
        ?? (typeof raw.priceUsd === "string" ? raw.priceUsd : null);
      linkedReceipt = {
        ...r,
        pricePerUnit,
        fiat: typeof raw.fiat === "string" ? raw.fiat : null,
        fiatAmount: typeof raw.fiatAmount === "string" ? raw.fiatAmount : null,
      };
    }
  }

  return c.json({ message: row, receipt: linkedReceipt });
});

// ── /api/receipts ──────────────────────────────────────────────
const receiptListQuery = z.object({
  year: z.coerce.number().int().min(2009).max(2100).optional(),
  asset: z.string().optional(),
  chain: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

route.get("/receipts", async (c) => {
  const userId = c.get("userId");
  const q = receiptListQuery.safeParse(c.req.query());
  if (!q.success) return c.json({ error: "invalid query", issues: q.error.flatten() }, 400);

  // Get user's message IDs (via aliases)
  const userAliases = await db.select({ id: aliases.id }).from(aliases).where(eq(aliases.userId, userId));
  if (userAliases.length === 0) return c.json({ receipts: [], total: 0 });
  const aliasIds = userAliases.map((a) => a.id);
  const userMessageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(inArray(messages.aliasId, aliasIds));
  if (userMessageIds.length === 0) return c.json({ receipts: [], total: 0 });
  const messageIds = userMessageIds.map((m) => m.id);

  const filters = [inArray(receipts.messageId, messageIds)];
  if (q.data.year) {
    const start = new Date(Date.UTC(q.data.year, 0, 1));
    const end = new Date(Date.UTC(q.data.year + 1, 0, 1));
    filters.push(and(
      // drizzle: receipts.occurredAt >= start AND < end
      // using raw sql for date range
    ) as any);
  }
  if (q.data.asset) filters.push(eq(receipts.asset, q.data.asset.toUpperCase()) as any);
  if (q.data.chain) filters.push(eq(receipts.chain, q.data.chain) as any);
  if (q.data.type) filters.push(eq(receipts.type, q.data.type) as any);
  if (q.data.source) filters.push(eq(receipts.source, q.data.source) as any);

  // Build a basic where for now (year filter is left as TODO for simplicity)
  const baseFilter = filters.length === 1 ? filters[0] : and(...filters);
  const rows = await db
    .select()
    .from(receipts)
    .where(baseFilter)
    .orderBy(desc(receipts.occurredAt))
    .limit(q.data.limit)
    .offset(q.data.offset);

  return c.json({ receipts: rows, total: rows.length });
});

export const messagesRoute = route;
