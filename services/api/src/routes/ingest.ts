/**
 * POST /api/ingest
 *
 * Receives a raw email envelope from an external transport
 * (CF Email Routing worker, Haraka SMTP plugin, manual curl).
 *
 * Auth: shared secret via `X-Ingest-Secret` header.
 * Body: JSON matching EmailEnvelope (from, fromName, subject, bodyText, bodyHtml, receivedAt)
 *       + `to` field — the alias email address it was sent to.
 *
 * Stores in messages table, runs parsers, normalizes into receipts table.
 *
 * NOTE: W3 stores plaintext body. W3.5 will add per-user keypair encryption.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages, receipts } from "../db/schema/index.js";
import { env } from "../lib/env.js";
import { parseEmail, type EmailKind } from "parsers";
import type { ChainmailVars } from "../middleware/auth.js";

const envelopeSchema = z.object({
  to: z.string().email(),
  from: z.string().min(1),
  fromName: z.string().optional(),
  subject: z.string().default(""),
  bodyText: z.string().default(""),
  bodyHtml: z.string().optional(),
  messageIdHeader: z.string().optional(),
  receivedAt: z.coerce.date().default(() => new Date()),
});

/** Map our EmailKind → receipt.type and receipt.source */
function normalizeReceipt(parsed: NonNullable<ReturnType<typeof parseEmail>>) {
  const kindToType: Record<EmailKind, string> = {
    cex_trade: parsed.data.side === "sell" || parsed.data.side === "sold" ? "sell" : "buy",
    cex_deposit: "deposit",
    cex_withdrawal: "withdraw",
    dex_swap: "swap",
    nft_mint: "mint",
    tx_notification: "transfer",
    unknown: "unknown",
  };
  const sourceMap: Record<string, string> = {
    coinbase: "cex",
    binance: "cex",
    indodax: "cex",
    ethereum: "explorer",
  };
  return {
    type: kindToType[parsed.kind] ?? "unknown",
    source: sourceMap[parsed.source] ?? parsed.source,
  };
}

export const ingestRoute = new Hono<{ Variables: ChainmailVars }>();

ingestRoute.post("/", async (c) => {
  // Auth
  const secret = c.req.header("x-ingest-secret");
  if (!secret || secret !== env.INGEST_SECRET) {
    return c.json({ error: "unauthorized" }, 401);
  }

  // Parse body
  const raw = await c.req.json().catch(() => null);
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "invalid payload", issues: parsed.error.flatten() }, 400);
  }
  const email = parsed.data;

  // Find alias by email
  const [alias] = await db
    .select()
    .from(aliases)
    .where(and(eq(aliases.email, email.to), eq(aliases.active, true)))
    .limit(1);
  if (!alias) {
    return c.json({ error: "alias not found or inactive", to: email.to }, 404);
  }

  // Run parsers
  const parsedReceipt = parseEmail({
    from: email.from,
    fromName: email.fromName,
    subject: email.subject,
    bodyText: email.bodyText,
    bodyHtml: email.bodyHtml,
    receivedAt: email.receivedAt,
  });

  // Insert message first (we need its ID for the receipt)
  const [insertedMsg] = await db
    .insert(messages)
    .values({
      aliasId: alias.id,
      fromAddr: email.from,
      fromName: email.fromName ?? null,
      toAddrs: [email.to],
      subject: email.subject || null,
      bodyText: email.bodyText || null,
      bodyHtml: email.bodyHtml ?? null,
      messageIdHeader: email.messageIdHeader ?? null,
      receivedAt: email.receivedAt,
      parserKey: parsedReceipt?.parserKey ?? null,
      parsedAt: parsedReceipt ? new Date() : null,
    })
    .returning({ id: messages.id });

  let receiptId: string | null = null;
  if (parsedReceipt) {
    const norm = normalizeReceipt(parsedReceipt);
    // Strip commas/spaces from amount before numeric insert ("5,000,000" → "5000000")
    const rawAmount = typeof parsedReceipt.data.amount === "string" ? parsedReceipt.data.amount : null;
    const cleanAmount = rawAmount?.replace(/[,\s]/g, "") ?? null;
    // Extract price + fiat fields. Only store in assetPriceUsd if currency is USD
    // (DB column is numeric and assumes US format — can't store "1.250.000" IDR).
    const rawPrice = parsedReceipt.data as Record<string, unknown>;
    const fiat = typeof rawPrice.fiat === "string" ? rawPrice.fiat.toUpperCase() : null;
    const priceStr = typeof rawPrice.price === "string" ? rawPrice.price : typeof rawPrice.priceUsd === "string" ? rawPrice.priceUsd : null;
    const isUsdPrice = fiat === "USD" || (priceStr && !rawPrice.fiat && /^\d+(\.\d+)?$/.test(priceStr));
    const cleanPrice = isUsdPrice && priceStr ? priceStr.replace(/[,\s]/g, "") : null;
    const fiatStr = typeof rawPrice.fiatAmount === "string" ? rawPrice.fiatAmount : null;
    const cleanFiatAmount = fiatStr?.replace(/[,\s]/g, "") ?? null;
    const [insertedReceipt] = await db
      .insert(receipts)
      .values({
        messageId: insertedMsg.id,
        source: norm.source,
        type: norm.type,
        chain: typeof parsedReceipt.data.chain === "string" ? parsedReceipt.data.chain : null,
        asset: typeof parsedReceipt.data.asset === "string" ? parsedReceipt.data.asset.toUpperCase() : null,
        amount: cleanAmount,
        assetPriceUsd: cleanPrice, // store price in numeric column (whatever fiat, label is in raw.fiat)
        txHash: typeof parsedReceipt.data.txHash === "string" ? parsedReceipt.data.txHash : null,
        counterparty: parsedReceipt.source,
        status: "confirmed",
        raw: { ...parsedReceipt.data, fiat, fiatAmount: cleanFiatAmount },
        occurredAt: email.receivedAt,
      })
      .returning({ id: receipts.id });
    receiptId = insertedReceipt.id;

    // Backfill message.receiptId
    await db.update(messages).set({ receiptId }).where(eq(messages.id, insertedMsg.id));
  }

  return c.json(
    {
      ok: true,
      messageId: insertedMsg.id,
      receiptId,
      parserKey: parsedReceipt?.parserKey ?? null,
      parsed: parsedReceipt
        ? { kind: parsedReceipt.kind, summary: parsedReceipt.summary, confidence: parsedReceipt.confidence }
        : null,
    },
    201
  );
});
