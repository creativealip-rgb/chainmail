import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { aliases } from "./aliases.js";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aliasId: uuid("alias_id")
      .notNull()
      .references(() => aliases.id, { onDelete: "cascade" }),
    // RFC 5322 Message-ID header (if present)
    messageIdHeader: text("message_id_header"),
    fromAddr: text("from_addr").notNull(),
    fromName: text("from_name"),
    toAddrs: jsonb("to_addrs").$type<string[]>().notNull().default([]),
    subject: text("subject"),
    // Encrypted body (AES-GCM ciphertext, base64). Plaintext never stored.
    encryptedBody: text("encrypted_body").notNull(),
    // Parsed receipt (NULL if parser didn't match)
    receiptId: uuid("receipt_id"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    aliasIdx: index("messages_alias_idx").on(t.aliasId),
    receivedIdx: index("messages_received_idx").on(t.receivedAt),
  })
);
