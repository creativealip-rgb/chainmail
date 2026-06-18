import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
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
    // Plaintext body (W3 — before encryption layer ships in W3.5)
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    // Encrypted body (AES-GCM ciphertext, base64). Plaintext never stored.
    // Nullable in W3 — populated when per-user keypair lands.
    encryptedBody: text("encrypted_body"),
    // System folder slug: inbox | sent | drafts | trash | junk | archive | flagged | important
    // "flagged" = starred, "important" = priority flag, both special system views
    folder: text("folder").notNull().default("inbox"),
    // Starred flag (independent of folder — a message can be starred in any folder)
    starred: boolean("starred").notNull().default(false),
    // Direction: 'inbound' (received from external) or 'outbound' (sent via composer)
    direction: text("direction").notNull().default("inbound"),
    // Delivery status: 'received' (inbound, in inbox) | 'queued' (outbound, not yet relayed) | 'sent' (outbound, relayed via SMTP) | 'failed' (outbound, relay error)
    status: text("status").notNull().default("received"),
    // Error message if status='failed'
    statusDetail: text("status_detail"),
    // Parsed receipt (NULL if parser didn't match)
    receiptId: uuid("receipt_id"),
    // Set once parser matches a known sender (e.g. "coinbase", "binance", "etherscan")
    parserKey: text("parser_key"),
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
    // Has the user opened/read this message
    readAt: timestamp("read_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    aliasIdx: index("messages_alias_idx").on(t.aliasId),
    receivedIdx: index("messages_received_idx").on(t.receivedAt),
    parserIdx: index("messages_parser_idx").on(t.parserKey),
    folderIdx: index("messages_folder_idx").on(t.folder),
    starredIdx: index("messages_starred_idx").on(t.starred),
    directionIdx: index("messages_direction_idx").on(t.direction),
    statusIdx: index("messages_status_idx").on(t.status),
  })
);
