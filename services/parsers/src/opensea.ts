/**
 * OpenSea parser (NFT marketplace).
 * Match: from=*@opensea.io OR subject contains "OpenSea"
 * Kinds: NFT mint/purchase/listing/sale
 */
import type { Parser, EmailEnvelope, ParsedReceipt } from "./index.js";

const RE_PURCHASE = /(?:You (?:purchased|bought)|Purchase confirmed)[:\s]+(.+?)\s+for\s+([\d.,]+)\s+(\w+)/i;
const RE_SALE = /(?:Your .+ sold|Sale confirmed)[:\s]+(.+?)\s+for\s+([\d.,]+)\s+(\w+)/i;
const RE_MINT = /(?:Minted|Successfully minted)[:\s]+(.+)/i;
const RE_LISTING = /(?:Listed|You listed)[:\s]+(.+?)\s+for\s+([\d.,]+)\s+(\w+)/i;
const RE_TXHASH = /(?:Transaction Hash|Tx Hash|TxID)[:\s]+(0x[a-fA-F0-9]{8,64})/i;

export const openseaParser: Parser = (email: EmailEnvelope): ParsedReceipt | null => {
  const isOpenSea =
    email.from.toLowerCase().includes("opensea") ||
    email.subject.toLowerCase().includes("opensea");
  if (!isOpenSea) return null;

  const text = email.bodyText;
  const txHash = text.match(RE_TXHASH)?.[1] ?? null;

  const purchase = text.match(RE_PURCHASE);
  if (purchase) {
    return {
      parserKey: "opensea",
      kind: "nft_mint",
      source: "opensea",
      summary: `Bought NFT "${purchase[1].trim()}" for ${purchase[2]} ${purchase[3]}`,
      data: {
        side: "bought",
        nftName: purchase[1].trim(),
        priceAmount: purchase[2],
        priceAsset: purchase[3].toUpperCase(),
        chain: "evm",
        protocol: "opensea",
        txHash,
      },
      confidence: 0.9,
    };
  }

  const sale = text.match(RE_SALE);
  if (sale) {
    return {
      parserKey: "opensea",
      kind: "nft_mint",
      source: "opensea",
      summary: `Sold NFT "${sale[1].trim()}" for ${sale[2]} ${sale[3]}`,
      data: {
        side: "sold",
        nftName: sale[1].trim(),
        priceAmount: sale[2],
        priceAsset: sale[3].toUpperCase(),
        chain: "evm",
        protocol: "opensea",
        txHash,
      },
      confidence: 0.9,
    };
  }

  const mint = text.match(RE_MINT);
  if (mint) {
    return {
      parserKey: "opensea",
      kind: "nft_mint",
      source: "opensea",
      summary: `Minted NFT "${mint[1].trim()}"`,
      data: {
        nftName: mint[1].trim(),
        chain: "evm",
        protocol: "opensea",
        txHash,
      },
      confidence: 0.85,
    };
  }

  const listing = text.match(RE_LISTING);
  if (listing) {
    return {
      parserKey: "opensea",
      kind: "nft_mint",
      source: "opensea",
      summary: `Listed NFT "${listing[1].trim()}" for ${listing[2]} ${listing[3]}`,
      data: {
        side: "listed",
        nftName: listing[1].trim(),
        priceAmount: listing[2],
        priceAsset: listing[3].toUpperCase(),
        chain: "evm",
        protocol: "opensea",
        txHash,
      },
      confidence: 0.85,
    };
  }

  return null;
};