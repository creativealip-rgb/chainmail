const RE_TX = /Tx\s+Hash[:\s]+(0x[a-fA-F0-9]{64})/i;
const RE_AMOUNT = /(?:Value|Amount)[:\s]+([\d.,]+)\s*(\w+)/i;
const RE_FROM = /From[:\s]+(0x[a-fA-F0-9]{40})/i;
const RE_TO = /To[:\s]+(0x[a-fA-F0-9]{40})/i;
export const etherscanParser = (email) => {
    const isEtherscan = email.from.toLowerCase().includes("etherscan") ||
        email.subject.toLowerCase().includes("etherscan") ||
        email.subject.toLowerCase().includes("tx hash");
    if (!isEtherscan)
        return null;
    const text = email.bodyText;
    const txMatch = text.match(RE_TX);
    if (!txMatch) {
        return {
            parserKey: "etherscan",
            kind: "unknown",
            source: "ethereum",
            summary: email.subject,
            data: { subject: email.subject },
            confidence: 0.4,
        };
    }
    const amount = text.match(RE_AMOUNT);
    const from = text.match(RE_FROM);
    const to = text.match(RE_TO);
    const txHash = txMatch[1] ?? "";
    const amt = amount?.[1];
    const asset = amount?.[2];
    return {
        parserKey: "etherscan",
        kind: "tx_notification",
        source: "ethereum",
        summary: `Tx ${txHash.slice(0, 10)}...${txHash.slice(-4)}${amt ? ` · ${amt} ${asset}` : ""}`,
        data: {
            txHash,
            chain: "ethereum",
            amount: amt,
            asset: asset?.toUpperCase(),
            from: from?.[1],
            to: to?.[1],
        },
        confidence: 0.95,
    };
};
