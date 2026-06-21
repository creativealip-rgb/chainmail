/**
 * Binance parser.
 * Match: from=*@binance.com OR subject contains "Binance"
 *
 * Tolerant regexes — Binance's email format has varied over the years.
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

// "Your deposit of 1000 USDT has been received" / "Deposit 1000 USDT confirmed"
const RE_DEPOSIT = /(?:Deposit|deposit)\s+(?:of\s+)?([\d.,]+)\s+(\w+)\s+(?:has been\s+)?(?:received|confirmed|successful)/i;
// "Your 42.50 USDT deposit on BSC was confirmed"
const RE_AMOUNT_DEPOSIT = /([\d.,]+)\s+(\w+)\s+deposit\b[\s\S]{0,120}?(?:was\s+)?(?:received|confirmed|successful)/i;
// "Your withdrawal of 0.1 BTC has been successful" / "Withdrawal 0.1 BTC completed"
const RE_WITHDRAWAL = /Withdrawal\s+(?:of\s+)?([\d.,]+)\s+(\w+)\s+(?:has been\s+)?(?:successful|completed|processed)/i;
// "Buy 10 BNB at 580.50 USDT each" / "Sell 2 ETH at 3000 USDT"
// Groups: 1=verb, 2=amount, 3=asset, 4=price
const RE_TRADE = /(Buy|Sell)\s+([\d.,]+)\s+(\w+)\s+at\s+([\d.,]+)/i;
// Fallback: "Amount: 1000 USDT ... Status: Confirmed"
const RE_AMOUNT_STATUS = /Amount[:\s]+([\d.,]+)\s+(\w+)[\s\S]{0,200}?(?:Status[:\s]+)?(?:Confirmed|received|successful)/i;

// "TX: 0xfeedbeef" / "Transaction ID: 0xabc..." / "TxHash: 0x..." (case-insensitive, hex 0x + 40-64 chars)
const RE_TXHASH = /(?:TX|TxHash|Transaction(?:\s+ID|\s+Hash)?|Hash)[:\s]+(0x[a-fA-F0-9]{8,64})/i;

export const binanceParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isBinance =
    email.from.toLowerCase().includes("binance") ||
    email.subject.toLowerCase().includes("binance");
  if (!isBinance) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const deposit = text.match(RE_DEPOSIT) ?? text.match(RE_AMOUNT_DEPOSIT) ?? text.match(RE_AMOUNT_STATUS);
  if (deposit && /deposit/i.test(text)) {
    return {
      parserKey: "binance",
      kind: "cex_deposit",
      source: "binance",
      summary: `Deposit ${deposit[1] ?? ""} ${deposit[2] ?? ""} received`,
      data: {
        amount: deposit[1] ?? null,
        asset: (deposit[2] ?? "").toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "binance",
      },
      confidence: 0.95,
    };
  }

  const withdrawal = text.match(RE_WITHDRAWAL);
  if (withdrawal) {
    return {
      parserKey: "binance",
      kind: "cex_withdrawal",
      source: "binance",
      summary: `Withdraw ${withdrawal[1] ?? ""} ${withdrawal[2] ?? ""} completed`,
      data: {
        amount: withdrawal[1] ?? null,
        asset: (withdrawal[2] ?? "").toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "binance",
      },
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
      data: {
        side: trade[1]?.toLowerCase() ?? "",
        amount: trade[2] ?? null,
        asset: (trade[3] ?? "").toUpperCase(),
        price: trade[4] ?? null,
        chain: "cex",
        txHash,
        counterparty: "binance",
      },
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
