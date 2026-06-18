/**
 * GET /api/messages?aliasId=&limit=&offset=
 * GET /api/messages/:id
 *
 * List messages for the authenticated user (filtered by their aliases).
 * Mark-as-read is implicit on GET /:id.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages } from "../db/schema/index.js";
import { requireAuth, type ChainmailVars } from "../middleware/auth.js";

export const messagesRoute = new Hono<{ Variables: ChainmailVars }>();
// All message endpoints require auth
messagesRoute.use("*", requireAuth());

const listQuery = z.object({
  aliasId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

messagesRoute.get("/", async (c) => {
  const userId = c.get("userId");
  const q = listQuery.safeParse(c.req.query());
  if (!q.success) return c.json({ error: "invalid query", issues: q.error.flatten() }, 400);

  // Find all aliases owned by this user
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
    messages: rows.map((r) => ({ ...r, aliasEmail: userAliases.find((a) => a.id === r.aliasId)?.email })),
    total: rows.length,
    limit: q.data.limit,
    offset: q.data.offset,
  });
});

messagesRoute.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ error: "invalid id" }, 400);

  // Ensure the message belongs to one of user's aliases
  const userAliases = await db
    .select({ id: aliases.id })
    .from(aliases)
    .where(eq(aliases.userId, userId));
  const allowed = new Set(userAliases.map((a) => a.id));

  const [row] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);
  if (!row || !allowed.has(row.aliasId)) {
    return c.json({ error: "not found" }, 404);
  }

  // Mark as read (idempotent)
  if (!row.readAt) {
    await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id));
    row.readAt = new Date();
  }

  return c.json({ message: row });
});
