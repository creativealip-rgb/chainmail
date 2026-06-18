/**
 * Chainmail parsers — turn raw email bodies into structured Receipts.
 * PRIVATE: not open-source. Alip-confirmed 2026-06-18.
 *
 * Input: an EmailEnvelope (from, subject, bodyText, bodyHtml, receivedAt)
 * Output: a ParsedReceipt with kind/amount/asset/txId/etc., or null if no parser matched.
 *
 * Each parser is a pure function: easy to unit-test, easy to add more.
 */
import { coinbaseParser } from "./coinbase.js";
import { binanceParser } from "./binance.js";
import { etherscanParser } from "./etherscan.js";

export type EmailKind = "cex_trade" | "cex_deposit" | "cex_withdrawal" | "dex_swap" | "nft_mint" | "tx_notification" | "unknown";

export interface EmailEnvelope {
  from: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: Date;
}

export interface ParsedReceipt {
  /** Stable key: which parser matched, e.g. "coinbase", "binance", "etherscan" */
  parserKey: string;
  /** Coarse category */
  kind: EmailKind;
  /** Source exchange/chain: "coinbase" | "binance" | "ethereum" */
  source: string;
  /** Free-form: "Bought 0.5 BTC" or "Swap 1 ETH -> 3,200 USDC" */
  summary: string;
  /** Parsed structured fields (parser-specific) */
  data: Record<string, unknown>;
  /** Confidence 0-1 — parsers should set honestly (1.0 = perfect regex match, 0.6 = inferred) */
  confidence: number;
}

export type Parser = (email: EmailEnvelope) => ParsedReceipt | null;

/** Registry: order matters. First match wins. Cheap checks first. */
const PARSERS: Parser[] = [coinbaseParser, binanceParser, etherscanParser];

/** Try each parser in order. Returns first match or null. */
export function parseEmail(email: EmailEnvelope): ParsedReceipt | null {
  for (const p of PARSERS) {
    const result = p(email);
    if (result) return result;
  }
  return null;
}

/** For /api/ingest — determine parserKey from sender domain. Cheap pre-filter. */
export function parserKeyForSender(fromAddr: string): string | null {
  const f = fromAddr.toLowerCase();
  if (f.includes("coinbase")) return "coinbase";
  if (f.includes("binance")) return "binance";
  if (f.includes("etherscan") || f.includes("ethereum")) return "etherscan";
  return null;
}

export { coinbaseParser, binanceParser, etherscanParser };
