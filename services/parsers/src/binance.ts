/**
 * Binance parser.
 * Match: from=*@binance.com OR subject contains "Binance"
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_DEPOSIT = /Deposit\s+([\d.,]+)\s+(\w+)\s+(?:received|confirmed|successful)/i;
const RE_WITHDRAWAL = /Withdrawal\s+of\s+([\d.,]+)\s+(\w+)\s+(?:has been|successful|completed)/i;
const RE_TRADE = /(Buy|Sell)\s+([\d.,]+)\s+(\w+)\s+at\s+([\d.,]+)/i;

export const binanceParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isBinance =
    email.from.toLowerCase().includes("binance") ||
    email.subject.toLowerCase().includes("binance");
  if (!isBinance) return null;

  const text = email.bodyText;

  const deposit = text.match(RE_DEPOSIT);
  if (deposit) {
    return {
      parserKey: "binance",
      kind: "cex_deposit",
      source: "binance",
      summary: `Deposit ${deposit[1]} ${deposit[2]} received`,
      data: { amount: deposit[1], asset: deposit[2].toUpperCase() },
      confidence: 0.95,
    };
  }

  const withdrawal = text.match(RE_WITHDRAWAL);
  if (withdrawal) {
    return {
      parserKey: "binance",
      kind: "cex_withdrawal",
      source: "binance",
      summary: `Withdraw ${withdrawal[1]} ${withdrawal[2]} completed`,
      data: { amount: withdrawal[1], asset: withdrawal[2].toUpperCase() },
      confidence: 0.95,
    };
  }

  const trade = text.match(RE_TRADE);
  if (trade) {
    return {
      parserKey: "binance",
      kind: "cex_trade",
      source: "binance",
      summary: `${trade[1]} ${trade[2]} ${trade[3]} at ${trade[4]}`,
      data: { side: trade[1].toLowerCase(), amount: trade[2], asset: trade[3].toUpperCase(), price: trade[4] },
      confidence: 0.9,
    };
  }

  return {
    parserKey: "binance",
    kind: "unknown",
    source: "binance",
    summary: email.subject,
    data: { subject: email.subject },
    confidence: 0.5,
  };
};
