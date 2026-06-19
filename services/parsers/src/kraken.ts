/**
 * Kraken parser (CEX).
 * Match: from=*@kraken.com OR subject contains "Kraken"
 * Kinds: trade confirmation, deposit, withdrawal
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_TRADE = /(?:Bought|Sold|Swap)\s+([\d.,]+)\s+(\w+)\s+(?:for|at|to)\s+([\d.,]+)\s+(\w+)/i;
const RE_DEPOSIT = /(?:Deposit|Deposited)\s+of\s+([\d.,]+)\s+(\w+)/i;
const RE_WITHDRAWAL = /Withdrawal\s+of\s+([\d.,]+)\s+(\w+)/i;
const RE_TXHASH = /(?:TxID|Transaction ID|TX Hash)[:\s]+([a-fA-F0-9]{8,64})/i;

export const krakenParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isKraken =
    email.from.toLowerCase().includes("kraken") ||
    email.subject.toLowerCase().includes("kraken");
  if (!isKraken) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const trade = text.match(RE_TRADE);
  if (trade) {
    return {
      parserKey: "kraken",
      kind: "cex_trade",
      source: "kraken",
      summary: `${trade[1]} ${trade[2]} → ${trade[3]} ${trade[4]}`,
      data: {
        amount: trade[1],
        asset: trade[2].toUpperCase(),
        priceAmount: trade[3],
        priceAsset: trade[4].toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "kraken",
      },
      confidence: 0.92,
    };
  }

  const deposit = text.match(RE_DEPOSIT);
  if (deposit) {
    return {
      parserKey: "kraken",
      kind: "cex_deposit",
      source: "kraken",
      summary: `Deposit ${deposit[1]} ${deposit[2]}`,
      data: {
        amount: deposit[1],
        asset: deposit[2].toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "kraken",
      },
      confidence: 0.9,
    };
  }

  const withdrawal = text.match(RE_WITHDRAWAL);
  if (withdrawal) {
    return {
      parserKey: "kraken",
      kind: "cex_withdrawal",
      source: "kraken",
      summary: `Withdrawal ${withdrawal[1]} ${withdrawal[2]}`,
      data: {
        amount: withdrawal[1],
        asset: withdrawal[2].toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "kraken",
      },
      confidence: 0.9,
    };
  }

  return null;
};