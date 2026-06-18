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
 * Stores in messages table, runs parsers, attaches parserKey if matched.
 *
 * NOTE: W3 stores plaintext body. W3.5 will add per-user keypair encryption.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages } from "../db/schema/index.js";
import { env } from "../lib/env.js";
import { parseEmail } from "parsers";
import type { ChainmailVars } from "../middleware/auth.js";

const envelopeSchema = z.object({
  to: z.string().email(), // alias address (recipient)
  from: z.string().min(1),
  fromName: z.string().optional(),
  subject: z.string().default(""),
  bodyText: z.string().default(""),
  bodyHtml: z.string().optional(),
  messageIdHeader: z.string().optional(),
  receivedAt: z.coerce.date().default(() => new Date()),
});

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

  // Find alias by email (the part before @ doesn't matter, we look up by full address)
  const [alias] = await db
    .select()
    .from(aliases)
    .where(and(eq(aliases.email, email.to), eq(aliases.active, true)))
    .limit(1);
  if (!alias) {
    return c.json({ error: "alias not found or inactive", to: email.to }, 404);
  }

  // Run parsers
  const receipt = parseEmail({
    from: email.from,
    fromName: email.fromName,
    subject: email.subject,
    bodyText: email.bodyText,
    bodyHtml: email.bodyHtml,
    receivedAt: email.receivedAt,
  });

  // Insert message
  const [inserted] = await db
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
      parserKey: receipt?.parserKey ?? null,
      parsedAt: receipt ? new Date() : null,
    })
    .returning({ id: messages.id, parserKey: messages.parserKey });

  return c.json(
    {
      ok: true,
      messageId: inserted.id,
      parserKey: inserted.parserKey,
      parsed: receipt
        ? { kind: receipt.kind, summary: receipt.summary, confidence: receipt.confidence }
        : null,
    },
    201
  );
});
