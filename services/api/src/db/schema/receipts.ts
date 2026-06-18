import { pgTable, uuid, text, timestamp, jsonb, numeric, index } from "drizzle-orm/pg-core";

/**
 * Normalized on-chain receipt — the result of running a parser on a message.
 * Source can be: cex, dex, nft, explorer, airdrop, tax
 * status can be: pending, confirmed, failed
 */
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id").notNull(),
    source: text("source").notNull(), // cex | dex | nft | explorer | airdrop | tax
    type: text("type").notNull(), // buy | sell | deposit | withdraw | swap | mint | etc
    chain: text("chain"), // ethereum | bitcoin | solana | polygon | base | etc
    asset: text("asset"), // BTC | ETH | USDC | NFT_COLLECTION | etc
    amount: numeric("amount", { precision: 36, scale: 18 }),
    assetPriceUsd: numeric("asset_price_usd", { precision: 18, scale: 8 }),
    txHash: text("tx_hash"),
    counterparty: text("counterparty"), // exchange/wallet name
    status: text("status").notNull().default("confirmed"),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull(), // parser-specific data
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    messageIdx: index("receipts_message_idx").on(t.messageId),
    typeIdx: index("receipts_type_idx").on(t.type),
    occurredIdx: index("receipts_occurred_idx").on(t.occurredAt),
  })
);
