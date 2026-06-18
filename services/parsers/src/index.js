/**
 * Chainmail parsers — turn raw email bodies into structured Receipts.
 * PRIVATE: not open-source. Alip-confirmed 2026-06-18.
 *
 * Input: an EmailEnvelope (from, subject, bodyText, bodyHtml, receivedAt)
 * Output: a ParsedReceipt with kind/amount/asset/txId/etc., or null if no parser matched.
 *
 * Each parser is a pure function: easy to unit-test, easy to add more.
 */
import { coinbaseParser } from "./coinbase.js";
import { binanceParser } from "./binance.js";
import { etherscanParser } from "./etherscan.js";
/** Registry: order matters. First match wins. Cheap checks first. */
const PARSERS = [coinbaseParser, binanceParser, etherscanParser];
/** Try each parser in order. Returns first match or null. */
export function parseEmail(email) {
    for (const p of PARSERS) {
        const result = p(email);
        if (result)
            return result;
    }
    return null;
}
/** For /api/ingest — determine parserKey from sender domain. Cheap pre-filter. */
export function parserKeyForSender(fromAddr) {
    const f = fromAddr.toLowerCase();
    if (f.includes("coinbase"))
        return "coinbase";
    if (f.includes("binance"))
        return "binance";
    if (f.includes("etherscan") || f.includes("ethereum"))
        return "etherscan";
    return null;
}
export { coinbaseParser, binanceParser, etherscanParser };
