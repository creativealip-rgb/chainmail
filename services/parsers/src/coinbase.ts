/**
 * Coinbase parser.
 * Match: from=*@coinbase.com OR subject contains "Coinbase"
 * Kinds: trade confirmation, deposit, withdrawal
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_BUY_SELL = /(Bought|Sold)\s+([\d.,]+)\s+(\w+)\s+(?:for|at)\s+\$?([\d.,]+)/i;
const RE_DEPOSIT = /Deposit(?:ed)?\s+([\d.,]+)\s+(\w+)/i;
const RE_WITHDRAWAL = /Withdrew\s+([\d.,]+)\s+(\w+)/i;

export const coinbaseParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isCoinbase =
    email.from.toLowerCase().includes("coinbase") ||
    email.subject.toLowerCase().includes("coinbase");
  if (!isCoinbase) return null;

  const text = email.bodyText;

  // Try trade first
  const trade = text.match(RE_BUY_SELL);
  if (trade) {
    return {
      parserKey: "coinbase",
      kind: "cex_trade",
      source: "coinbase",
      summary: `${trade[1]} ${trade[2]} ${trade[3]} at $${trade[4]}`,
      data: {
        side: trade[1].toLowerCase(), // "bought" or "sold"
        amount: trade[2],
        asset: trade[3].toUpperCase(),
        priceUsd: trade[4],
      },
      confidence: 0.95,
    };
  }

  const deposit = text.match(RE_DEPOSIT);
  if (deposit) {
    return {
      parserKey: "coinbase",
      kind: "cex_deposit",
      source: "coinbase",
      summary: `Deposit ${deposit[1] ?? ""} ${deposit[2] ?? ""}`,
      data: { amount: deposit[1] ?? null, asset: (deposit[2] ?? "").toUpperCase() },
      confidence: 0.9,
    };
  }

  const withdrawal = text.match(RE_WITHDRAWAL);
  if (withdrawal) {
    return {
      parserKey: "coinbase",
      kind: "cex_withdrawal",
      source: "coinbase",
      summary: `Withdraw ${withdrawal[1] ?? ""} ${withdrawal[2] ?? ""}`,
      data: { amount: withdrawal[1] ?? null, asset: (withdrawal[2] ?? "").toUpperCase() },
      confidence: 0.9,
    };
  }

  // Coinbase email but unknown structure — still attribute
  return {
    parserKey: "coinbase",
    kind: "unknown",
    source: "coinbase",
    summary: email.subject,
    data: { subject: email.subject },
    confidence: 0.5,
  };
};
