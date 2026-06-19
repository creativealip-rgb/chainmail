/**
 * Parser test suite — runs against compiled dist/ with Node's built-in test runner.
 * Usage: node --test tests/parsers.test.js
 *
 * Each fixture is a JSON file in tests/fixtures/ with shape:
 *   { label, from, fromName?, subject, bodyText, expect? }
 *
 * The test asserts:
 *   - Parser matches (or doesn't) the expected parserKey
 *   - For positive cases: kind, asset, amount, confidence >= 0.9
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  coinbaseParser,
  binanceParser,
  etherscanParser,
  indodaxParser,
  krakenParser,
  tokocryptoParser,
  uniswapParser,
  openseaParser,
  phantomParser,
  metamaskParser,
  parseEmail,
  parserKeyForSender,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

function loadFixtures() {
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(readFileSync(join(fixturesDir, f), "utf-8")));
}

const fixtures = loadFixtures();

test("fixtures load", () => {
  assert.ok(fixtures.length >= 5, `expected at least 5 fixtures, got ${fixtures.length}`);
});

test("parserKeyForSender", () => {
  assert.equal(parserKeyForSender("no-reply@coinbase.com"), "coinbase");
  assert.equal(parserKeyForSender("noreply@binance.com"), "binance");
  assert.equal(parserKeyForSender("noreply@etherscan.io"), "etherscan");
  assert.equal(parserKeyForSender("support@indodax.com"), "indodax");
  assert.equal(parserKeyForSender("hi@random.com"), null);
});

test("coinbase: buy BTC parsed correctly", () => {
  const fx = fixtures.find((f) => f.label === "coinbase-buy-btc");
  assert.ok(fx, "fixture missing");
  const r = coinbaseParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "coinbase");
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.asset, "BTC");
  assert.equal(r.data.amount, "0.5");
  assert.ok(r.confidence >= 0.9, `confidence too low: ${r.confidence}`);
});

test("coinbase: sell ETH parsed", () => {
  const fx = fixtures.find((f) => f.label === "coinbase-sell-eth");
  const r = coinbaseParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.side, "sold");
  assert.equal(r.data.asset, "ETH");
});

test("coinbase: deposit USDC parsed", () => {
  const fx = fixtures.find((f) => f.label === "coinbase-deposit-usdc");
  const r = coinbaseParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.kind, "cex_deposit");
  assert.equal(r.data.asset, "USDC");
});

test("coinbase: 'received X BTC' pattern + txHash extracted", () => {
  const fx = fixtures.find((f) => f.label === "coinbase-deposit-received");
  assert.ok(fx, "fixture missing");
  const r = coinbaseParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser should match 'received X BTC'");
  assert.equal(r.parserKey, "coinbase");
  assert.equal(r.kind, "cex_deposit");
  assert.equal(r.data.asset, "BTC");
  assert.equal(r.data.amount, "0.5");
  assert.equal(r.data.txHash, "0xdeadbeef1234567890abcdef1234567890abcdef");
  assert.equal(r.data.counterparty, "coinbase");
  assert.equal(r.data.chain, "cex");
  assert.ok(r.confidence >= 0.9);
});

test("coinbase: misformatted email → kind=unknown but parserKey set", () => {
  const fx = fixtures.find((f) => f.label === "coinbase-misformatted");
  const r = coinbaseParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "should still attribute Coinbase email");
  assert.equal(r.parserKey, "coinbase");
  assert.equal(r.kind, "unknown");
});

test("binance: deposit USDT parsed", () => {
  const fx = fixtures.find((f) => f.label === "binance-deposit-usdt");
  const r = binanceParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "binance parser should match this deposit email");
  assert.equal(r.parserKey, "binance");
  assert.equal(r.kind, "cex_deposit");
  assert.equal(r.data.asset, "USDT");
  assert.ok(r.confidence >= 0.9, `confidence too low: ${r.confidence}`);
});

test("binance: deposit with TX hash extracted", () => {
  const fx = fixtures.find((f) => f.label === "binance-deposit-with-tx");
  const r = binanceParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.data.txHash, "0xfeedbeef1234567890abcdef1234567890abcdef");
  assert.equal(r.data.chain, "cex");
  assert.equal(r.data.counterparty, "binance");
});

test("binance: withdrawal BTC parsed", () => {
  const fx = fixtures.find((f) => f.label === "binance-withdrawal-btc");
  const r = binanceParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.kind, "cex_withdrawal");
  assert.equal(r.data.asset, "BTC");
});

test("binance: buy BNB parsed", () => {
  const fx = fixtures.find((f) => f.label === "binance-buy-bnb");
  const r = binanceParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.asset, "BNB");
});

test("etherscan: tx ETH with from/to/value parsed", () => {
  const fx = fixtures.find((f) => f.label === "etherscan-tx-eth");
  const r = etherscanParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.parserKey, "etherscan");
  assert.equal(r.kind, "tx_notification");
  assert.ok(r.data.txHash?.startsWith("0x"));
  assert.equal(r.data.asset, "ETH");
  assert.equal(r.data.amount, "1.5");
  assert.ok(r.data.from?.startsWith("0x"));
  assert.ok(r.data.to?.startsWith("0x"));
});

test("etherscan: tx USDC parsed", () => {
  const fx = fixtures.find((f) => f.label === "etherscan-tx-usdc");
  const r = etherscanParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.kind, "tx_notification");
  assert.equal(r.data.asset, "USDC");
});

test("parseEmail: routes unknown sender → null", () => {
  const fx = fixtures.find((f) => f.label === "unknown-sender");
  const r = parseEmail({ ...fx, receivedAt: new Date() });
  assert.equal(r, null);
});

test("parseEmail: indodax routes to indodax parser", () => {
  const env = {
    from: "noreply@indodax.com",
    fromName: "Indodax",
    subject: "Deposit Berhasil",
    bodyText: "Deposit IDR 5,000,000 telah berhasil masuk ke akun Anda.",
    receivedAt: new Date(),
  };
  const r = parseEmail(env);
  assert.ok(r, "indodax should match");
  assert.equal(r.parserKey, "indodax");
  assert.equal(r.data.asset, "IDR");
  assert.ok(r.confidence >= 0.9);
});

test("parseEmail: indodax buy BTC", () => {
  const env = {
    from: "noreply@indodax.com",
    subject: "Beli Bitcoin Berhasil",
    bodyText: "Beli 0.01 BTC seharga Rp 12,500,000 telah berhasil.",
    receivedAt: new Date(),
  };
  const r = parseEmail(env);
  assert.ok(r);
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.asset, "BTC");
  assert.equal(r.data.side, "buy");
});

test("parseEmail: indodax Jumlah/Total Bayar pattern with IDR price", () => {
  const fx = fixtures.find((f) => f.label === "indodax-buy-btc-jumlah");
  assert.ok(fx, "fixture missing");
  const r = indodaxParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser should match Jumlah/Total Bayar");
  assert.equal(r.parserKey, "indodax");
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.side, "buy");
  assert.equal(r.data.asset, "BTC");
  assert.equal(r.data.amount, "0.01");
  assert.equal(r.data.fiat, "IDR");
  assert.equal(r.data.fiatAmount, "12.500.000");
  assert.equal(r.data.price, "1.250.000.000");
  assert.equal(r.data.counterparty, "indodax");
  assert.equal(r.data.chain, "cex");
  assert.ok(r.confidence >= 0.9);
});

test("parseEmail: routes correct parser based on sender", () => {
  const cases = [
    { from: "no-reply@coinbase.com", expected: "coinbase" },
    { from: "noreply@binance.com", expected: "binance" },
    { from: "noreply@etherscan.io", expected: "etherscan" },
    { from: "noreply@indodax.com", expected: "indodax" },
  ];
  for (const c of cases) {
    const r = parseEmail({
      from: c.from,
      subject: "Test",
      bodyText: "Some content",
      receivedAt: new Date(),
    });
    if (r) {
      assert.equal(
        r.parserKey,
        c.expected,
        `sender ${c.from} routed to ${r.parserKey}, expected ${c.expected}`
      );
    }
    // some may return null if no pattern matches; that's OK
  }
});

// ============================================================================
// W7 Phase 2 — 6 new parsers (kraken, tokocrypto, uniswap, opensea, phantom, metamask)
// ============================================================================

test("parserKeyForSender: new W7 parsers", () => {
  assert.equal(parserKeyForSender("no-reply@kraken.com"), "kraken");
  assert.equal(parserKeyForSender("noreply@tokocrypto.com"), "tokocrypto");
  assert.equal(parserKeyForSender("noreply@uniswap.org"), "uniswap");
  assert.equal(parserKeyForSender("noreply@opensea.io"), "opensea");
  assert.equal(parserKeyForSender("noreply@phantom.app"), "phantom");
  assert.equal(parserKeyForSender("no-reply@metamask.io"), "metamask");
});

test("kraken: buy BTC parsed", () => {
  const fx = fixtures.find((f) => f.label === "kraken-buy-btc");
  assert.ok(fx, "fixture missing");
  const r = krakenParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "kraken");
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.asset, "BTC");
  assert.equal(r.data.amount, "0.25");
  assert.ok(r.data.txHash);
  assert.ok(r.confidence >= 0.9);
});

test("kraken: deposit ETH parsed", () => {
  const fx = fixtures.find((f) => f.label === "kraken-deposit-eth");
  const r = krakenParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.kind, "cex_deposit");
  assert.equal(r.data.asset, "ETH");
  assert.equal(r.data.amount, "2.5");
});

test("tokocrypto: buy BTC (Indonesian)", () => {
  const fx = fixtures.find((f) => f.label === "tokocrypto-buy-btc");
  assert.ok(fx);
  const r = tokocryptoParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "tokocrypto");
  assert.equal(r.kind, "cex_trade");
  assert.equal(r.data.side, "bought");
  assert.equal(r.data.asset, "BTC");
  assert.equal(r.data.fiat, "IDR");
  assert.ok(r.confidence >= 0.9);
});

test("tokocrypto: sell ETH (Indonesian)", () => {
  const fx = fixtures.find((f) => f.label === "tokocrypto-sell-eth");
  const r = tokocryptoParser({ ...fx, receivedAt: new Date() });
  assert.ok(r);
  assert.equal(r.data.side, "sold");
  assert.equal(r.data.asset, "ETH");
});

test("uniswap: swap ETH → USDC parsed", () => {
  const fx = fixtures.find((f) => f.label === "uniswap-swap-eth-usdc");
  assert.ok(fx);
  const r = uniswapParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "uniswap");
  assert.equal(r.kind, "dex_swap");
  assert.equal(r.data.assetIn, "ETH");
  assert.equal(r.data.assetOut, "USDC");
  assert.equal(r.data.chain, "evm");
  assert.ok(r.data.txHash);
  assert.ok(r.confidence >= 0.9);
});

test("opensea: NFT purchase parsed", () => {
  const fx = fixtures.find((f) => f.label === "opensea-purchase-nft");
  assert.ok(fx);
  const r = openseaParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "opensea");
  assert.equal(r.kind, "nft_mint");
  assert.equal(r.data.side, "bought");
  assert.equal(r.data.priceAsset, "ETH");
  assert.ok(r.data.nftName.includes("Bored Ape"));
  assert.ok(r.confidence >= 0.85);
});

test("phantom: receive SOL (Solana)", () => {
  const fx = fixtures.find((f) => f.label === "phantom-receive-sol");
  assert.ok(fx);
  const r = phantomParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "phantom");
  assert.equal(r.kind, "tx_notification");
  assert.equal(r.data.asset, "SOL");
  assert.equal(r.data.chain, "solana");
  assert.equal(r.data.side, "received");
  assert.ok(r.data.txHash);
  assert.ok(r.confidence >= 0.9);
});

test("metamask: swap ETH → USDC parsed", () => {
  const fx = fixtures.find((f) => f.label === "metamask-swap-eth-usdc");
  assert.ok(fx);
  const r = metamaskParser({ ...fx, receivedAt: new Date() });
  assert.ok(r, "parser returned null");
  assert.equal(r.parserKey, "metamask");
  assert.equal(r.kind, "dex_swap");
  assert.equal(r.data.assetIn, "ETH");
  assert.equal(r.data.assetOut, "USDC");
  assert.equal(r.data.chain, "evm");
  assert.ok(r.data.txHash);
  assert.ok(r.confidence >= 0.9);
});

test("parseEmail: routes W7 parsers correctly", () => {
  const cases = [
    { from: "noreply@kraken.com",     subject: "Buy order filled",   bodyText: "You bought 0.1 ETH for 350 USD" },
    { from: "noreply@tokocrypto.com", subject: "Beli ETH Berhasil", bodyText: "Beli 0.5 ETH seharga Rp 25,000,000" },
    { from: "noreply@uniswap.org",    subject: "Swap done",         bodyText: "Swap 1 ETH for 3200 USDC" },
    { from: "noreply@opensea.io",     subject: "You purchased",    bodyText: "You purchased CryptoPunk #1 for 50 ETH" },
    { from: "noreply@phantom.app",    subject: "Received",          bodyText: "You received 5 SOL" },
    { from: "no-reply@metamask.io",   subject: "Transaction",       bodyText: "Swapped: 0.1 ETH for 320 USDC" },
  ];
  const expectedKeys = ["kraken", "tokocrypto", "uniswap", "opensea", "phantom", "metamask"];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const r = parseEmail({ ...c, receivedAt: new Date() });
    assert.ok(r, `${c.from} should route to ${expectedKeys[i]}`);
    assert.equal(r.parserKey, expectedKeys[i], `${c.from} → ${r.parserKey}, expected ${expectedKeys[i]}`);
  }
});
