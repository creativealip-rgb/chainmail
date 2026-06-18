/**
 * Indodax parser (Indonesian exchange).
 * Match: from=*@indodax.com OR subject contains "Indodax"
 *
 * Indodax emails are typically in Indonesian + English mix.
 * Common: "Deposit IDR 5,000,000" / "Beli 0.01 BTC seharga Rp 12,500,000"
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_DEPOSIT_IDR = /(?:Deposit|Setoran)\s+(?:IDR|Rp)\s*([\d.,]+)/i;
const RE_DEPOSIT_CRYPTO = /Deposit\s+([\d.,]+)\s+(\w+)/i;
const RE_BUY = /(?:Beli|Buy)\s+([\d.,]+)\s+(\w+)\s+(?:seharga|at|with|for)\s+(?:Rp|IDR|USDT|\$)?\s*([\d.,]+)/i;
const RE_BUY_ID = /Jumlah[:\s]+([\d.,]+)\s+(\w+)[\s\S]{0,500}?Total\s+Bayar[:\s]+Rp\s*([\d.,]+)/i;
const RE_BUY_ID_PRICE = /Harga[:\s]+Rp\s*([\d.,]+)/i;
const RE_SELL = /(?:Jual|Sell)\s+([\d.,]+)\s+(\w+)/i;
const RE_WITHDRAWAL = /(?:Withdraw|Penarikan)\s+([\d.,]+)\s+(\w+)/i;
const RE_TXHASH = /(?:Transaction\s+(?:ID|Hash)|TxHash|TX|Hash)[:\s]+(0x[a-fA-F0-9]{8,64})/i;

export const indodaxParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isIndodax =
    email.from.toLowerCase().includes("indodax") ||
    email.subject.toLowerCase().includes("indodax");
  if (!isIndodax) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const depositIdr = text.match(RE_DEPOSIT_IDR);
  if (depositIdr) {
    return {
      parserKey: "indodax",
      kind: "cex_deposit",
      source: "indodax",
      summary: `Deposit IDR ${depositIdr[1] ?? ""}`,
      data: {
        amount: depositIdr[1] ?? null,
        asset: "IDR",
        currency: "IDR",
        chain: "cex",
        txHash,
        counterparty: "indodax",
      },
      confidence: 0.95,
    };
  }

  const depositCrypto = text.match(RE_DEPOSIT_CRYPTO);
  if (depositCrypto) {
    return {
      parserKey: "indodax",
      kind: "cex_deposit",
      source: "indodax",
      summary: `Deposit ${depositCrypto[1] ?? ""} ${depositCrypto[2] ?? ""}`,
      data: {
        amount: depositCrypto[1] ?? null,
        asset: (depositCrypto[2] ?? "").toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "indodax",
      },
      confidence: 0.9,
    };
  }

  const buy = text.match(RE_BUY);
  if (buy) {
    return {
      parserKey: "indodax",
      kind: "cex_trade",
      source: "indodax",
      summary: `Beli ${buy[1] ?? ""} ${buy[2] ?? ""} seharga ${buy[3] ?? ""}`,
      data: {
        side: "buy",
        amount: buy[1] ?? null,
        asset: (buy[2] ?? "").toUpperCase(),
        price: buy[3] ?? null,
        currency: "IDR",
        fiat: "IDR",
        fiatAmount: buy[3] ?? null,
        chain: "cex",
        txHash,
        counterparty: "indodax",
      },
      confidence: 0.9,
    };
  }

  // Indonesian "Jumlah: X BTC ... Total Bayar: Rp Y" pattern
  const buyId = text.match(RE_BUY_ID);
  if (buyId) {
    const priceIdr = text.match(RE_BUY_ID_PRICE)?.[1] ?? buyId[3] ?? null;
    return {
      parserKey: "indodax",
      kind: "cex_trade",
      source: "indodax",
      summary: `Beli ${buyId[1] ?? ""} ${buyId[2] ?? ""} seharga Rp ${priceIdr ?? ""}`,
      data: {
        side: "buy",
        amount: buyId[1] ?? null,
        asset: (buyId[2] ?? "").toUpperCase(),
        price: priceIdr,
        fiat: "IDR",
        fiatAmount: buyId[3] ?? null,
        chain: "cex",
        txHash,
        counterparty: "indodax",
      },
      confidence: 0.95,
    };
  }

  const sell = text.match(RE_SELL);
  if (sell) {
    return {
      parserKey: "indodax",
      kind: "cex_trade",
      source: "indodax",
      summary: `Jual ${sell[1] ?? ""} ${sell[2] ?? ""}`,
      data: {
        side: "sell",
        amount: sell[1] ?? null,
        asset: (sell[2] ?? "").toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "indodax",
      },
      confidence: 0.9,
    };
  }

  const withdrawal = text.match(RE_WITHDRAWAL);
  if (withdrawal) {
    return {
      parserKey: "indodax",
      kind: "cex_withdrawal",
      source: "indodax",
      summary: `Withdraw ${withdrawal[1] ?? ""} ${withdrawal[2] ?? ""}`,
      data: {
        amount: withdrawal[1] ?? null,
        asset: (withdrawal[2] ?? "").toUpperCase(),
        chain: "cex",
        txHash,
        counterparty: "indodax",
      },
      confidence: 0.9,
    };
  }

  return {
    parserKey: "indodax",
    kind: "unknown",
    source: "indodax",
    summary: email.subject,
    data: { subject: email.subject },
    confidence: 0.5,
  };
};
