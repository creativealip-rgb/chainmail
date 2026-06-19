/**
 * Tokocrypto parser (CEX Indonesia).
 * Match: from=*@tokocrypto.com OR subject contains "Tokocrypto"
 * Kinds: trade confirmation, deposit IDR/crypto
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_BUY = /(?:Beli|Buy)\s+([\d.,]+)\s+(\w+)\s+(?:seharga|with|at)\s+(?:Rp|IDR)?\s*([\d.,]+)/i;
const RE_SELL = /(?:Jual|Sell)\s+([\d.,]+)\s+(\w+)\s+(?:seharga|with|at)\s+(?:Rp|IDR)?\s*([\d.,]+)/i;
const RE_DEPOSIT = /(?:Deposit|Setoran)\s+([\d.,]+)\s+(\w+)/i;
const RE_WITHDRAWAL = /(?:Withdraw|Penarikan)\s+([\d.,]+)\s+(\w+)/i;
const RE_TXHASH = /(?:TxHash|Transaction ID|ID Transaksi)[:\s]+([a-fA-F0-9]{8,64})/i;

export const tokocryptoParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isTokocrypto =
    email.from.toLowerCase().includes("tokocrypto") ||
    email.subject.toLowerCase().includes("tokocrypto");
  if (!isTokocrypto) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const buy = text.match(RE_BUY);
  if (buy) {
    return {
      parserKey: "tokocrypto",
      kind: "cex_trade",
      source: "tokocrypto",
      summary: `Beli ${buy[1]} ${buy[2]} seharga Rp ${buy[3]}`,
      data: {
        side: "bought",
        amount: buy[1],
        asset: buy[2].toUpperCase(),
        priceAmount: buy[3],
        fiat: "IDR",
        fiatAmount: buy[3],
        chain: "cex",
        txHash,
        counterparty: "tokocrypto",
      },
      confidence: 0.92,
    };
  }

  const sell = text.match(RE_SELL);
  if (sell) {
    return {
      parserKey: "tokocrypto",
      kind: "cex_trade",
      source: "tokocrypto",
      summary: `Jual ${sell[1]} ${sell[2]} seharga Rp ${sell[3]}`,
      data: {
        side: "sold",
        amount: sell[1],
        asset: sell[2].toUpperCase(),
        priceAmount: sell[3],
        fiat: "IDR",
        fiatAmount: sell[3],
        chain: "cex",
        txHash,
        counterparty: "tokocrypto",
      },
      confidence: 0.92,
    };
  }

  const deposit = text.match(RE_DEPOSIT);
  if (deposit) {
    return {
      parserKey: "tokocrypto",
      kind: "cex_deposit",
      source: "tokocrypto",
      summary: `Deposit ${deposit[1]} ${deposit[2]}`,
      data: {
        amount: deposit[1],
        asset: deposit[2].toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "tokocrypto",
      },
      confidence: 0.88,
    };
  }

  const withdrawal = text.match(RE_WITHDRAWAL);
  if (withdrawal) {
    return {
      parserKey: "tokocrypto",
      kind: "cex_withdrawal",
      source: "tokocrypto",
      summary: `Penarikan ${withdrawal[1]} ${withdrawal[2]}`,
      data: {
        amount: withdrawal[1],
        asset: withdrawal[2].toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "tokocrypto",
      },
      confidence: 0.88,
    };
  }

  return null;
};