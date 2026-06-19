import { useEffect, useState } from "react";
import { apiGet } from "@/services/api/client";
import styles from "./LedgerView.module.css";

interface AssetBucket {
  asset: string;
  bought: number;
  sold: number;
  received: number;
  sent: number;
  swappedIn: number;
  swappedOut: number;
  txCount: number;
}

interface SourceBucket {
  source: string;
  txCount: number;
  assets: string[];
}

interface ChainBucket {
  chain: string;
  txCount: number;
}

interface MonthBucket {
  month: number;
  txCount: number;
}

interface LedgerData {
  year: number;
  totalReceipts: number;
  perAsset: AssetBucket[];
  perSource: SourceBucket[];
  perChain: ChainBucket[];
  perMonth: MonthBucket[];
  usdEstimate: { withPrice: number; missing: number; withPriceCount: number };
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  coinbase:    { label: "Coinbase",    color: "#1652f0" },
  binance:     { label: "Binance",     color: "#f0b90b" },
  indodax:     { label: "Indodax",     color: "#f15a22" },
  kraken:      { label: "Kraken",      color: "#7132f5" },
  tokocrypto:  { label: "Tokocrypto",  color: "#00b894" },
  uniswap:     { label: "Uniswap",     color: "#ff007a" },
  opensea:     { label: "OpenSea",     color: "#2081e2" },
  phantom:     { label: "Phantom",     color: "#ab9ff2" },
  metamask:    { label: "MetaMask",    color: "#f6851b" },
  etherscan:   { label: "Etherscan",   color: "#5d8aaa" },
  cex:         { label: "CEX (generic)", color: "#6b7280" },
  dex:         { label: "DEX (generic)", color: "#ec4899" },
  evm:         { label: "EVM",         color: "#627eea" },
  solana:      { label: "Solana",      color: "#9945ff" },
  cex_chain:   { label: "CEX",         color: "#6b7280" },
  unknown:     { label: "Unknown",     color: "#9ca3af" },
};

function fmtAmount(n: number): string {
  if (n === 0) return "—";
  if (Math.abs(n) < 0.001) return n.toFixed(8);
  if (Math.abs(n) < 1) return n.toFixed(6);
  return n.toFixed(4);
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function LedgerView({ year, isAuth }: { year: number; isAuth: boolean }) {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuth) return;
    setLoading(true);
    setError(null);
    apiGet<LedgerData>(`api/ledger/${year}`)
      .then(setData)
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [year, isAuth]);

  if (!isAuth) {
    return <div className={styles.empty}>Sign in to view your ledger.</div>;
  }
  if (loading) return <div className={styles.empty}>Loading ledger…</div>;
  if (error) return <div className={styles.empty}>Failed to load: {error}</div>;
  if (!data) return <div className={styles.empty}>No data.</div>;

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.hero}>
          <h1 className={styles.title}>{year} Tax Ledger</h1>
          <p className={styles.subtitle}>
            {data.totalReceipts} parsed receipt{data.totalReceipts === 1 ? "" : "s"} ·
            USD estimate: {fmtUsd(data.usdEstimate.withPrice)}{" "}
            <span className={styles.muted}>
              ({data.usdEstimate.withPriceCount} priced, {data.usdEstimate.missing} missing)
            </span>
          </p>
        </div>
        <a
          href={`/api/receipts/export.csv?year=${year}`}
          className={styles.exportBtn}
          download
          title="Download Koinly-compatible CSV for this year"
        >
          ⬇ Export CSV
        </a>
      </div>

      {data.totalReceipts === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIllustration} aria-hidden>📊</div>
          <p className={styles.emptyTitle}>No receipts for {year} yet</p>
          <p className={styles.muted}>
            Forward crypto emails to your alias — they'll be parsed and added to this ledger automatically.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {/* Per-Asset */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>By Asset</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Bought</th>
                  <th>Sold</th>
                  <th>Received</th>
                  <th>Sent</th>
                  <th>Swapped</th>
                  <th className={styles.numCell}>Tx</th>
                </tr>
              </thead>
              <tbody>
                {data.perAsset.map((a) => (
                  <tr key={a.asset}>
                    <td className={styles.assetCell}>{a.asset}</td>
                    <td>{a.bought > 0 ? fmtAmount(a.bought) : "—"}</td>
                    <td>{a.sold > 0 ? fmtAmount(a.sold) : "—"}</td>
                    <td>{a.received > 0 ? fmtAmount(a.received) : "—"}</td>
                    <td>{a.sent > 0 ? fmtAmount(a.sent) : "—"}</td>
                    <td>{a.swappedOut > 0 || a.swappedIn > 0 ? `${fmtAmount(a.swappedOut)} → ${fmtAmount(a.swappedIn)}` : "—"}</td>
                    <td className={styles.numCell}>{a.txCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Per-Source */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>By Source</h2>
            <div className={styles.tagCloud}>
              {data.perSource.map((s) => {
                const meta = SOURCE_LABELS[s.source] ?? { label: s.source, color: "#6b7280" };
                return (
                  <span
                    key={s.source}
                    className={styles.sourceTag}
                    style={{ background: meta.color }}
                    title={`Assets: ${s.assets.join(", ")}`}
                  >
                    {meta.label} · {s.txCount}
                  </span>
                );
              })}
            </div>
          </section>

          {/* Per-Chain */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>By Chain</h2>
            <div className={styles.chainBars}>
              {data.perChain.map((c) => {
                const max = Math.max(...data.perChain.map((x) => x.txCount));
                const pct = max > 0 ? (c.txCount / max) * 100 : 0;
                const meta = SOURCE_LABELS[c.chain] ?? { label: c.chain, color: "#6b7280" };
                return (
                  <div key={c.chain} className={styles.chainRow}>
                    <div className={styles.chainLabel}>{meta.label}</div>
                    <div className={styles.chainBar}>
                      <div
                        className={styles.chainFill}
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                    <div className={styles.chainCount}>{c.txCount}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Per-Month */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>By Month</h2>
            <div className={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const bucket = data.perMonth.find((x) => x.month === m);
                const count = bucket?.txCount ?? 0;
                const max = Math.max(1, ...data.perMonth.map((x) => x.txCount));
                const intensity = count / max;
                return (
                  <div
                    key={m}
                    className={styles.monthCell}
                    style={{
                      background: count > 0
                        ? `rgba(15, 118, 110, ${0.15 + intensity * 0.6})`
                        : "var(--bg-base)",
                      borderColor: count > 0 ? "var(--color-accent, #0f766e)" : "var(--border-subtle)",
                    }}
                    title={`${MONTH_NAMES[m]} ${year}: ${count} receipt${count === 1 ? "" : "s"}`}
                  >
                    <div className={styles.monthName}>{MONTH_NAMES[m]}</div>
                    <div className={styles.monthCount}>{count}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}