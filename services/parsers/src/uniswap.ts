/**
 * Uniswap parser (DEX).
 * Match: from=*@uniswap.org OR subject contains "Uniswap"
 * Kinds: swap (token A -> token B)
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_SWAP = /Swap\s+([\d.,]+)\s+(\w+)\s+(?:for|to|→|->)\s+([\d.,]+)\s+(\w+)/i;
const RE_SWAP_ARROW = /Swapped\s+([\d.,]+)\s+(\w+)\s+(?:for|to|→|->)\s+([\d.,]+)\s+(\w+)/i;
const RE_TXHASH = /(?:Transaction Hash|Tx Hash|TxID|Tx)[:\s]+(0x[a-fA-F0-9]{8,64})/i;

export const uniswapParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isUniswap =
    email.from.toLowerCase().includes("uniswap") ||
    email.subject.toLowerCase().includes("uniswap");
  if (!isUniswap) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const swap = text.match(RE_SWAP) ?? text.match(RE_SWAP_ARROW);
  if (swap) {
    return {
      parserKey: "uniswap",
      kind: "dex_swap",
      source: "uniswap",
      summary: `Swap ${swap[1]} ${swap[2]} → ${swap[3]} ${swap[4]}`,
      data: {
        amountIn: swap[1],
        assetIn: swap[2].toUpperCase(),
        amountOut: swap[3],
        assetOut: swap[4].toUpperCase(),
        chain: "evm", // Uniswap is EVM-based
        protocol: "uniswap",
        txHash,
      },
      confidence: 0.95,
    };
  }

  return null;
};