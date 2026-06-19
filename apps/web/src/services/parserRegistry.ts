/**
 * Parser brand registry — single source of truth.
 * Used by MessageList (badge), MessageView (badge), LedgerView (chip + bar).
 * Keep in sync with services/api/packages/parsers/src/registry.ts.
 */

export interface ParserMeta {
  label: string;
  color: string;
  category: "cex" | "dex" | "nft" | "explorer" | "wallet";
}

export const PARSER_REGISTRY: Record<string, ParserMeta> = {
  coinbase:    { label: "Coinbase",   color: "#1652f0", category: "cex" },
  binance:     { label: "Binance",    color: "#f0b90b", category: "cex" },
  indodax:     { label: "Indodax",    color: "#f15a22", category: "cex" },
  kraken:      { label: "Kraken",     color: "#7132f5", category: "cex" },
  tokocrypto:  { label: "Tokocrypto", color: "#00b894", category: "cex" },
  uniswap:     { label: "Uniswap",    color: "#ff007a", category: "dex" },
  opensea:     { label: "OpenSea",    color: "#2081e2", category: "nft" },
  phantom:     { label: "Phantom",    color: "#ab9ff2", category: "wallet" },
  metamask:    { label: "MetaMask",   color: "#f6851b", category: "wallet" },
  etherscan:   { label: "Etherscan",  color: "#5d8aaa", category: "explorer" },
};

export const CHAIN_REGISTRY: Record<string, { label: string; color: string }> = {
  cex_chain:   { label: "CEX",        color: "#6b7280" },
  evm:         { label: "EVM",        color: "#627eea" },
  solana:      { label: "Solana",     color: "#9945ff" },
  cex:         { label: "CEX",        color: "#6b7280" },
  dex:         { label: "DEX",        color: "#ec4899" },
  unknown:     { label: "Unknown",    color: "#9ca3af" },
};

export function parserMeta(key: string | null | undefined): ParserMeta | null {
  if (!key) return null;
  return PARSER_REGISTRY[key] ?? null;
}

export function chainMeta(key: string): { label: string; color: string } {
  return CHAIN_REGISTRY[key] ?? { label: key, color: "#9ca3af" };
}

export const ACTIVE_PARSER_COUNT = Object.keys(PARSER_REGISTRY).length;