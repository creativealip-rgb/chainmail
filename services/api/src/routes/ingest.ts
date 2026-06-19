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
 * W3.5: encrypts body with per-user X25519 envelope encryption before storage.
 *       Plaintext bodyText/bodyHtml are NEVER stored.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages, receipts, users } from "../db/schema/index.js";
import { env } from "../lib/env.js";
import { emitToUser } from "../lib/realtime.js";
import { parseEmail, type EmailKind } from "parsers";
import { encryptForRecipient } from "@ui/crypto";
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

  // Find alias by email (and join user to get their ECDH pub key)
  const [row] = await db
    .select({
      alias: aliases,
      userPub: users.publicKey,
    })
    .from(aliases)
    .innerJoin(users, eq(aliases.userId, users.id))
    .where(and(eq(aliases.email, email.to), eq(aliases.active, true)))
    .limit(1);

  if (!row) {
    return c.json({ error: "alias not found or inactive", to: email.to }, 404);
  }
  const alias = row.alias;
  const userEcdhPub = row.userPub;
  if (!userEcdhPub) {
    return c.json({ error: "user has no encryption keypair", to: email.to }, 500);
  }

  // Run parsers (operate on plaintext body)
  const parsedReceipt = parseEmail({
    from: email.from,
    fromName: email.fromName,
    subject: email.subject,
    bodyText: email.bodyText,
    bodyHtml: email.bodyHtml,
    receivedAt: email.receivedAt,
  });

  // W3.5: envelope-encrypt the body before storage
  const plaintext = email.bodyText || email.bodyHtml || "";
  const env2 = await encryptForRecipient(plaintext, userEcdhPub);
  const encryptedJson = JSON.stringify(env2);

  // Insert message — bodyText/bodyHtml are NEVER stored (only the envelope)
  const [insertedMsg] = await db
    .insert(messages)
    .values({
      aliasId: alias.id,
      fromAddr: email.from,
      fromName: email.fromName ?? null,
      toAddrs: [email.to],
      subject: email.subject || null,
      bodyText: null,        // PII protection — only envelope stored
      bodyHtml: null,
      encryptedBody: encryptedJson,
      folder: (email as any).folder ?? "inbox",
      messageIdHeader: email.messageIdHeader ?? null,
      receivedAt: email.receivedAt,
      parserKey: parsedReceipt?.parserKey ?? null,
      parsedAt: parsedReceipt ? new Date() : null,
    })
    .returning({ id: messages.id });

  let receiptId: string | null = null;
  if (parsedReceipt) {
    const norm = normalizeReceipt(parsedReceipt);
    const rawAmount = typeof parsedReceipt.data.amount === "string" ? parsedReceipt.data.amount : null;
    const cleanAmount = rawAmount?.replace(/[,\s]/g, "") ?? null;
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
        assetPriceUsd: cleanPrice,
        txHash: typeof parsedReceipt.data.txHash === "string" ? parsedReceipt.data.txHash : null,
        counterparty: parsedReceipt.source,
        status: "confirmed",
        raw: { ...parsedReceipt.data, fiat, fiatAmount: cleanFiatAmount },
        occurredAt: email.receivedAt,
      })
      .returning({ id: receipts.id });
    receiptId = insertedReceipt.id;

    await db.update(messages).set({ receiptId }).where(eq(messages.id, insertedMsg.id));
  }

  // W5.2: realtime push — notify the recipient's open tabs so the inbox updates
  //        without polling. Frontend prepends the message and refetches the list.
  emitToUser(alias.userId, "message.created", {
    messageId: insertedMsg.id,
    aliasId: alias.id,
    from: email.from,
    subject: email.subject || null,
    receivedAt: email.receivedAt.toISOString(),
    hasReceipt: receiptId !== null,
    parserKey: parsedReceipt?.parserKey ?? null,
  });

  return c.json(
    {
      ok: true,
      messageId: insertedMsg.id,
      receiptId,
      parserKey: parsedReceipt?.parserKey ?? null,
      parsed: parsedReceipt
        ? { kind: parsedReceipt.kind, summary: parsedReceipt.summary, confidence: parsedReceipt.confidence }
        : null,
      encrypted: true,
    },
    201
  );
});
