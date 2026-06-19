/**
 * GET /api/ledger/:year — tax-year rollup
 *
 * Aggregates parsed receipts for the authenticated user into a tax-ready summary.
 * - Per-asset totals (bought / sold / received / sent / swapped)
 * - Per-source totals (coinbase, binance, etc.)
 * - Per-month count + volume
 * - Per-chain totals (evm, solana, cex)
 * - USD-equivalent estimate (uses assetPriceUsd when available)
 *
 * Designed to power a Koinly/CoinTracker-style annual tax export.
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases, messages, receipts } from "../db/schema/index.js";
import { requireAuth, type ChainmailVars } from "../middleware/auth.js";

const route = new Hono<{ Variables: ChainmailVars }>();
route.use("*", requireAuth());

const yearParam = z.coerce.number().int().min(2009).max(2100);

interface ReceiptRow {
  source: string;
  type: string;
  chain: string | null;
  asset: string | null;
  amount: string | null;
  assetPriceUsd: string | null;
  occurredAt: Date;
}

interface AssetBucket {
  asset: string;
  bought: number;
  sold: number;
  received: number;
  sent: number;
  swappedIn: number;
  swappedOut: number;
  txCount: number;
}

interface SourceBucket {
  source: string;
  txCount: number;
  assets: string[];
}

interface ChainBucket {
  chain: string;
  txCount: number;
}

interface MonthBucket {
  month: number; // 1..12
  txCount: number;
}

route.get("/ledger/:year", async (c) => {
  const userId = c.get("userId");
  const parsed = yearParam.safeParse(c.req.param("year"));
  if (!parsed.success) return c.json({ error: "invalid year" }, 400);
  const year = parsed.data;

  // Resolve user's message IDs
  const userAliases = await db.select({ id: aliases.id }).from(aliases).where(eq(aliases.userId, userId));
  if (userAliases.length === 0) {
    return c.json({
      year,
      totalReceipts: 0,
      perAsset: [],
      perSource: [],
      perChain: [],
      perMonth: [],
      usdEstimate: { withPrice: 0, missing: 0 },
    });
  }
  const aliasIds = userAliases.map((a) => a.id);
  const userMessageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(inArray(messages.aliasId, aliasIds));
  if (userMessageIds.length === 0) {
    return c.json({
      year,
      totalReceipts: 0,
      perAsset: [],
      perSource: [],
      perChain: [],
      perMonth: [],
      usdEstimate: { withPrice: 0, missing: 0 },
    });
  }
  const messageIds = userMessageIds.map((m) => m.id);

  // Year window: Jan 1 - Dec 31 UTC
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db
    .select({
      source: receipts.source,
      type: receipts.type,
      chain: receipts.chain,
      asset: receipts.asset,
      amount: receipts.amount,
      assetPriceUsd: receipts.assetPriceUsd,
      occurredAt: receipts.occurredAt,
    })
    .from(receipts)
    .where(
      and(
        inArray(receipts.messageId, messageIds),
        gte(receipts.occurredAt, start),
        lt(receipts.occurredAt, end)
      )
    );

  // Aggregate
  const perAssetMap = new Map<string, AssetBucket>();
  const perSourceMap = new Map<string, SourceBucket>();
  const perChainMap = new Map<string, ChainBucket>();
  const perMonthMap = new Map<number, MonthBucket>();
  let usdWithPrice = 0;
  let usdMissing = 0;

  for (const r of rows as ReceiptRow[]) {
    const amt = r.amount ? Number(r.amount) : 0;
    const asset = r.asset ?? "UNKNOWN";
    const source = r.source ?? "unknown";
    const chain = r.chain ?? "unknown";
    const month = r.occurredAt.getUTCMonth() + 1;

    // Per-asset
    const a = perAssetMap.get(asset) ?? {
      asset,
      bought: 0, sold: 0, received: 0, sent: 0, swappedIn: 0, swappedOut: 0,
      txCount: 0,
    };
    if (r.type === "buy") a.bought += amt;
    else if (r.type === "sell") a.sold += amt;
    else if (r.type === "deposit") a.received += amt;
    else if (r.type === "withdraw") a.sent += amt;
    else if (r.type === "swap") { a.swappedOut += amt; }
    else if (r.type === "swap_in") a.swappedIn += amt;
    a.txCount += 1;
    perAssetMap.set(asset, a);

    // Per-source
    const s = perSourceMap.get(source) ?? { source, txCount: 0, assets: [] };
    s.txCount += 1;
    if (!s.assets.includes(asset)) s.assets.push(asset);
    perSourceMap.set(source, s);

    // Per-chain
    const ch = perChainMap.get(chain) ?? { chain, txCount: 0 };
    ch.txCount += 1;
    perChainMap.set(chain, ch);

    // Per-month
    const mo = perMonthMap.get(month) ?? { month, txCount: 0 };
    mo.txCount += 1;
    perMonthMap.set(month, mo);

    // USD estimate
    if (r.assetPriceUsd) {
      usdWithPrice += amt * Number(r.assetPriceUsd);
    } else {
      usdMissing += 1;
    }
  }

  // Sort + shape
  const perAsset = Array.from(perAssetMap.values())
    .sort((a, b) => b.txCount - a.txCount);
  const perSource = Array.from(perSourceMap.values())
    .sort((a, b) => b.txCount - a.txCount);
  const perChain = Array.from(perChainMap.values())
    .sort((a, b) => b.txCount - a.txCount);
  const perMonth = Array.from(perMonthMap.values())
    .sort((a, b) => a.month - b.month);

  return c.json({
    year,
    totalReceipts: rows.length,
    perAsset,
    perSource,
    perChain,
    perMonth,
    usdEstimate: {
      withPrice: Number(usdWithPrice.toFixed(2)),
      missing: usdMissing,
      withPriceCount: rows.length - usdMissing,
    },
  });
});

export const ledgerRoute = route;