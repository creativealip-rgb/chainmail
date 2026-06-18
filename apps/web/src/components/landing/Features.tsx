import styles from "./Features.module.css";

const FEATURES = [
  {
    title: "Forward, no migration",
    body: "Get a unique alias. Add one Gmail filter. New crypto emails flow into Chainmail. Your primary inbox stays untouched.",
    status: "shipped",
  },
  {
    title: "Parse CEX, DEX, NFT, explorer",
    body: "Coinbase, Binance, Etherscan at launch. Uniswap, OpenSea, Phantom, Indodax next. Each parser tested against 50+ real emails.",
    status: "wip",
  },
  {
    title: "CSV export, tax season ready",
    body: "Per-year, per-exchange, per-chain rollup. Koinly and CoinTracker import format. Stop pasting CSVs from five exchanges by hand.",
    status: "wip",
  },
  {
    title: "Encrypted, server can't read",
    body: "AES-GCM-256 + Ed25519. Your passphrase never leaves the device. We store ciphertext, not plaintext.",
    status: "shipped",
  },
];

const STATUS_LABEL: Record<string, string> = {
  shipped: "Live in demo",
  wip: "In progress",
};

export function Features() {
  return (
    <section id="features">
      <header className={styles.header}>
        <h2>What Chainmail does</h2>
        <p>Four jobs a normal email client will not do for you.</p>
      </header>

      <div className={styles.grid}>
        {FEATURES.map((f, i) => (
          <div key={f.title} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.numeral} aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={styles.title}>{f.title}</h3>
              <span
                className={styles.badge}
                data-status={f.status}
                aria-label={STATUS_LABEL[f.status]}
              >
                {f.status === "shipped" ? "Live" : "WIP"}
              </span>
            </div>
            <p className={styles.body}>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
