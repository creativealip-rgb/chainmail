/**
 * GET /api/messages?aliasId=&folder=&labelId=&limit=&offset=
 * GET /api/messages/:id
 * GET /api/receipts?year=&asset=&chain=
 *
 * Messages: list for the authenticated user (filtered by their aliases).
 *           Mark-as-read is implicit on GET /:id.
 * Receipts: aggregated on-chain receipts for tax/audit use.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, gte, lt, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages, receipts, messageLabels, labels } from "../db/schema/index.js";
import { requireAuth, type ChainmailVars } from "../middleware/auth.js";

const route = new Hono<{ Variables: ChainmailVars }>();
route.use("*", requireAuth());

// ── /api/messages ──────────────────────────────────────────────
const messageListQuery = z.object({
  aliasId: z.string().uuid().optional(),
  folder: z
    .enum(["inbox", "sent", "drafts", "trash", "junk", "archive", "flagged", "important", "all"])
    .optional(),
  labelId: z.string().uuid().optional(),
  starred: z.coerce.boolean().optional(),
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
    return c.json({ messages: [], total: 0, limit: q.data.limit, offset: q.data.offset, folder: q.data.folder ?? null });
  }
  const allowedAliasIds = userAliases.map((a) => a.id);
  const aliasFilter = q.data.aliasId && allowedAliasIds.includes(q.data.aliasId)
    ? eq(messages.aliasId, q.data.aliasId)
    : inArray(messages.aliasId, allowedAliasIds);

  // Build folder filter
  // Default to 'inbox' when no folder, labelId, or starred filter is specified.
  // Special "flagged" view = starred messages across all folders.
  const folder = q.data.folder
    ?? (q.data.labelId || q.data.starred ? "all" : "inbox");

  // folder='flagged' is mapped to starred=true filter
  const folderFilter =
    folder === "all" ? undefined
    : folder === "flagged" ? eq(messages.starred, true)
    : eq(messages.folder, folder);

  // Explicit starred filter overrides folder
  const starredFilter = typeof q.data.starred === "boolean" ? eq(messages.starred, q.data.starred) : undefined;

  // Build base where (alias + folder + starred)
  const baseConditions = [aliasFilter];
  if (folderFilter) baseConditions.push(folderFilter);
  if (starredFilter) baseConditions.push(starredFilter);
  const baseFilter = baseConditions.length === 1 ? baseConditions[0] : and(...baseConditions);

  // If labelId provided, also filter by labels via subquery
  let rows: Array<{
    id: string;
    aliasId: string;
    fromAddr: string;
    fromName: string | null;
    subject: string | null;
    folder: string;
    starred: boolean;
    parserKey: string | null;
    receiptId: string | null;
    parsedAt: Date | null;
    readAt: Date | null;
    receivedAt: Date;
  }>;

  if (q.data.labelId) {
    // Verify label ownership
    const [owned] = await db
      .select({ id: labels.id })
      .from(labels)
      .where(and(eq(labels.id, q.data.labelId), eq(labels.userId, userId)))
      .limit(1);
    if (!owned) return c.json({ error: "unknown labelId" }, 404);

    const ml = db
      .select({ messageId: messageLabels.messageId })
      .from(messageLabels)
      .where(eq(messageLabels.labelId, q.data.labelId))
      .as("ml");
    rows = await db
      .select({
        id: messages.id,
        aliasId: messages.aliasId,
        fromAddr: messages.fromAddr,
        fromName: messages.fromName,
        toAddrs: messages.toAddrs,
        subject: messages.subject,
        folder: messages.folder,
        starred: messages.starred,
        direction: messages.direction,
        status: messages.status,
        parserKey: messages.parserKey,
        receiptId: messages.receiptId,
        parsedAt: messages.parsedAt,
        readAt: messages.readAt,
        receivedAt: messages.receivedAt,
      })
      .from(messages)
      .innerJoin(ml, eq(ml.messageId, messages.id))
      .where(baseFilter)
      .orderBy(desc(messages.receivedAt))
      .limit(q.data.limit)
      .offset(q.data.offset);
  } else {
    rows = await db
      .select({
        id: messages.id,
        aliasId: messages.aliasId,
        fromAddr: messages.fromAddr,
        fromName: messages.fromName,
        toAddrs: messages.toAddrs,
        subject: messages.subject,
        folder: messages.folder,
        starred: messages.starred,
        direction: messages.direction,
        status: messages.status,
        parserKey: messages.parserKey,
        receiptId: messages.receiptId,
        parsedAt: messages.parsedAt,
        readAt: messages.readAt,
        receivedAt: messages.receivedAt,
      })
      .from(messages)
      .where(baseFilter)
      .orderBy(desc(messages.receivedAt))
      .limit(q.data.limit)
      .offset(q.data.offset);
  }

  // Fetch labels for all message IDs in a single query (avoids N+1)
  const messageIds = rows.map((r) => r.id);
  const labelsByMsg = new Map<string, { id: string; name: string; color: string }[]>();
  if (messageIds.length > 0) {
    const labelRows = await db
      .select({
        messageId: messageLabels.messageId,
        id: labels.id,
        name: labels.name,
        color: labels.color,
      })
      .from(messageLabels)
      .innerJoin(labels, eq(messageLabels.labelId, labels.id))
      .where(inArray(messageLabels.messageId, messageIds));
    for (const lr of labelRows) {
      const arr = labelsByMsg.get(lr.messageId) ?? [];
      arr.push({ id: lr.id, name: lr.name, color: lr.color });
      labelsByMsg.set(lr.messageId, arr);
    }
  }

  return c.json({
    messages: rows.map((r) => ({
      ...r,
      aliasEmail: userAliases.find((a) => a.id === r.aliasId)?.email,
      labels: labelsByMsg.get(r.id) ?? [],
    })),
    total: rows.length,
    limit: q.data.limit,
    offset: q.data.offset,
    folder,
    labelId: q.data.labelId ?? null,
  });
});

// ── /api/messages (POST: send outbound) ───────────────────────
const sendBody = z.object({
  aliasId: z.string().uuid().optional(),
  to: z.array(z.string().email()).min(1).max(20),
  cc: z.array(z.string().email()).max(20).optional(),
  bcc: z.array(z.string().email()).max(20).optional(),
  subject: z.string().max(998).default(""),
  bodyText: z.string().default(""),
  bodyHtml: z.string().optional(),
});

route.post("/messages", async (c) => {
  const userId = c.get("userId");
  const parsed = sendBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "invalid body", issues: parsed.error.flatten() }, 400);

  // Resolve sending alias
  let aliasId = parsed.data.aliasId;
  if (!aliasId) {
    const userAliasList = await db
      .select({ id: aliases.id, email: aliases.email })
      .from(aliases)
      .where(eq(aliases.userId, userId))
      .limit(1);
    if (userAliasList.length === 0) return c.json({ error: "no alias — create one first" }, 400);
    aliasId = userAliasList[0].id;
  }
  const [ownAlias] = await db
    .select({ id: aliases.id, email: aliases.email })
    .from(aliases)
    .where(and(eq(aliases.id, aliasId), eq(aliases.userId, userId)))
    .limit(1);
  if (!ownAlias) return c.json({ error: "alias not found" }, 404);

  // Plaintext body stored for MVP. W3.5 client-side encryption will replace this.
  const bodyText = parsed.data.bodyText || "";
  const bodyHtml = parsed.data.bodyHtml ?? (bodyText ? `<p>${bodyText.replace(/\n/g, "<br>")}</p>` : "");

  const [row] = await db
    .insert(messages)
    .values({
      aliasId: ownAlias.id,
      fromAddr: ownAlias.email,
      fromName: null,
      toAddrs: parsed.data.to,
      subject: parsed.data.subject,
      bodyText,
      bodyHtml,
      folder: "sent",
      direction: "outbound",
      status: "queued",
      receivedAt: new Date(),
    })
    .returning();

  return c.json({ message: row }, 201);
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

  // Include labels
  const messageLabelsRows = await db
    .select({ id: labels.id, name: labels.name, color: labels.color })
    .from(messageLabels)
    .innerJoin(labels, eq(messageLabels.labelId, labels.id))
    .where(eq(messageLabels.messageId, id));

  return c.json({
    message: row,
    receipt: linkedReceipt,
    labels: messageLabelsRows,
    encrypted: true,
  });
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
    filters.push(gte(receipts.occurredAt, start));
    filters.push(lt(receipts.occurredAt, end));
  }
  if (q.data.asset) filters.push(eq(receipts.asset, q.data.asset.toUpperCase()) as any);
  if (q.data.chain) filters.push(eq(receipts.chain, q.data.chain) as any);
  if (q.data.type) filters.push(eq(receipts.type, q.data.type) as any);
  if (q.data.source) filters.push(eq(receipts.source, q.data.source) as any);

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

// ── /api/receipts/export.csv ──────────────────────────────────
// Streams CSV for the user's receipts (optionally filtered by year).
// Columns are stable: date,source,type,chain,asset,amount,price_usd,fiat,fiat_amount,tx_hash,counterparty,status
route.get("/receipts/export.csv", async (c) => {
  const userId = c.get("userId");

  const yearParam = c.req.query("year");
  const year = yearParam ? Number(yearParam) : null;
  if (year !== null && (!Number.isInteger(year) || year < 2009 || year > 2100)) {
    return c.json({ error: "invalid year" }, 400);
  }

  const userAliases = await db.select({ id: aliases.id }).from(aliases).where(eq(aliases.userId, userId));
  if (userAliases.length === 0) {
    return new Response(headerLine(), { status: 200, headers: csvHeaders(year, 0) });
  }
  const aliasIds = userAliases.map((a) => a.id);
  const userMessageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(inArray(messages.aliasId, aliasIds));
  if (userMessageIds.length === 0) {
    return new Response(headerLine(), { status: 200, headers: csvHeaders(year, 0) });
  }
  const messageIds = userMessageIds.map((m) => m.id);

  const filters = [inArray(receipts.messageId, messageIds)];
  if (year !== null) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    filters.push(gte(receipts.occurredAt, start));
    filters.push(lt(receipts.occurredAt, end));
  }
  const baseFilter = filters.length === 1 ? filters[0] : and(...filters);

  const rows = await db
    .select({
      occurredAt: receipts.occurredAt,
      source: receipts.source,
      type: receipts.type,
      chain: receipts.chain,
      asset: receipts.asset,
      amount: receipts.amount,
      assetPriceUsd: receipts.assetPriceUsd,
      txHash: receipts.txHash,
      counterparty: receipts.counterparty,
      status: receipts.status,
      raw: receipts.raw,
    })
    .from(receipts)
    .where(baseFilter)
    .orderBy(desc(receipts.occurredAt))
    .limit(10000);

  const body = headerLine() + rows.map(receiptRow).join("");
  return new Response(body, { status: 200, headers: csvHeaders(year, rows.length) });
});

function headerLine(): string {
  return [
    "date",
    "source",
    "type",
    "chain",
    "asset",
    "amount",
    "price_usd",
    "fiat",
    "fiat_amount",
    "tx_hash",
    "counterparty",
    "status",
  ].join(",") + "\n";
}

function csvHeaders(year: number | null, count: number): Record<string, string> {
  const filename =
    "chainmail-receipts" + (year ? `-${year}` : "") + `.csv`;
  return {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"`,
    "x-row-count": String(count),
  };
}

function csvField(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function receiptRow(r: {
  occurredAt: Date | null;
  source: string;
  type: string;
  chain: string | null;
  asset: string | null;
  amount: string | number | null;
  assetPriceUsd: string | number | null;
  txHash: string | null;
  counterparty: string | null;
  status: string;
  raw: Record<string, unknown> | null;
}): string {
  const raw = (r.raw ?? {}) as Record<string, unknown>;
  const fiat = typeof raw.fiat === "string" ? raw.fiat : "";
  const fiatAmount =
    typeof raw.fiatAmount === "string" || typeof raw.fiatAmount === "number"
      ? raw.fiatAmount
      : "";
  return [
    r.occurredAt ? r.occurredAt.toISOString() : "",
    r.source,
    r.type,
    r.chain ?? "",
    r.asset ?? "",
    r.amount ?? "",
    r.assetPriceUsd ?? "",
    fiat,
    fiatAmount,
    r.txHash ?? "",
    r.counterparty ?? "",
    r.status,
  ]
    .map(csvField)
    .join(",") + "\n";
}

export const messagesRoute = route;
