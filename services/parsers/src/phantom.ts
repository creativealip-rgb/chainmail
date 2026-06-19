/**
 * Phantom wallet parser (Solana).
 * Match: from=*@phantom.app OR subject contains "Phantom"
 * Kinds: tx_notification (send/receive/swap on Solana)
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_RECEIVED = /(?:Received|You received|Deposited)\s+([\d.,]+)\s+(\w+)/i;
const RE_SENT = /(?:Sent|You sent|Transferred)\s+([\d.,]+)\s+(\w+)/i;
const RE_SWAP = /(?:Swapped|Swap)\s+([\d.,]+)\s+(\w+)\s+(?:for|to|→|->)\s+([\d.,]+)\s+(\w+)/i;
const RE_SIGNATURE = /(?:Signature|Tx Signature|Transaction)[:\s]+([a-zA-Z0-9]{64,128})/i;

export const phantomParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isPhantom =
    email.from.toLowerCase().includes("phantom") ||
    email.subject.toLowerCase().includes("phantom");
  if (!isPhantom) return null;

  const text = email.bodyText;
  const signature = text.match(RE_SIGNATURE)?.[1] ?? null;

  const swap = text.match(RE_SWAP);
  if (swap) {
    return {
      parserKey: "phantom",
      kind: "dex_swap",
      source: "phantom",
      summary: `Swap ${swap[1]} ${swap[2]} → ${swap[3]} ${swap[4]}`,
      data: {
        amountIn: swap[1],
        assetIn: swap[2].toUpperCase(),
        amountOut: swap[3],
        assetOut: swap[4].toUpperCase(),
        chain: "solana",
        protocol: "phantom",
        txHash: signature,
      },
      confidence: 0.9,
    };
  }

  const received = text.match(RE_RECEIVED);
  if (received) {
    return {
      parserKey: "phantom",
      kind: "tx_notification",
      source: "phantom",
      summary: `Received ${received[1]} ${received[2]}`,
      data: {
        side: "received",
        amount: received[1],
        asset: received[2].toUpperCase(),
        chain: "solana",
        protocol: "phantom",
        txHash: signature,
      },
      confidence: 0.92,
    };
  }

  const sent = text.match(RE_SENT);
  if (sent) {
    return {
      parserKey: "phantom",
      kind: "tx_notification",
      source: "phantom",
      summary: `Sent ${sent[1]} ${sent[2]}`,
      data: {
        side: "sent",
        amount: sent[1],
        asset: sent[2].toUpperCase(),
        chain: "solana",
        protocol: "phantom",
        txHash: signature,
      },
      confidence: 0.92,
    };
  }

  return null;
};