/**
 * MetaMask wallet parser (EVM).
 * Match: from=*@metamask.io OR subject contains "MetaMask"
 * Kinds: tx_notification (send/receive/swap on EVM)
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_RECEIVED = /(?:Received|You received|Incoming)[:\s]+([\d.,]+)\s+(\w+)/i;
const RE_SENT = /(?:Sent|You sent|Outgoing)[:\s]+([\d.,]+)\s+(\w+)/i;
const RE_SWAP = /(?:Swapped|Swap)[:\s]+([\d.,]+)\s+(\w+)\s+(?:for|to|→|->)\s+([\d.,]+)\s+(\w+)/i;
const RE_TXHASH = /(?:Transaction Hash|Tx Hash|TxID|Tx)[:\s]+(0x[a-fA-F0-9]{8,64})/i;

export const metamaskParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isMetamask =
    email.from.toLowerCase().includes("metamask") ||
    email.subject.toLowerCase().includes("metamask");
  if (!isMetamask) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const swap = text.match(RE_SWAP);
  if (swap) {
    return {
      parserKey: "metamask",
      kind: "dex_swap",
      source: "metamask",
      summary: `Swap ${swap[1]} ${swap[2]} → ${swap[3]} ${swap[4]}`,
      data: {
        amountIn: swap[1],
        assetIn: swap[2].toUpperCase(),
        amountOut: swap[3],
        assetOut: swap[4].toUpperCase(),
        chain: "evm",
        protocol: "metamask",
        txHash,
      },
      confidence: 0.9,
    };
  }

  const received = text.match(RE_RECEIVED);
  if (received) {
    return {
      parserKey: "metamask",
      kind: "tx_notification",
      source: "metamask",
      summary: `Received ${received[1]} ${received[2]}`,
      data: {
        side: "received",
        amount: received[1],
        asset: received[2].toUpperCase(),
        chain: "evm",
        protocol: "metamask",
        txHash,
      },
      confidence: 0.92,
    };
  }

  const sent = text.match(RE_SENT);
  if (sent) {
    return {
      parserKey: "metamask",
      kind: "tx_notification",
      source: "metamask",
      summary: `Sent ${sent[1]} ${sent[2]}`,
      data: {
        side: "sent",
        amount: sent[1],
        asset: sent[2].toUpperCase(),
        chain: "evm",
        protocol: "metamask",
        txHash,
      },
      confidence: 0.92,
    };
  }

  return null;
};