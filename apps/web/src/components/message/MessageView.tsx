import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { ApiMessageDetail, ApiReceipt } from "@/store/slices/messagesSlice";
import { decryptMessageBody, getUnlockedKey, type KeyPair } from "@/services/crypto/vault";
import { LabelPicker } from "./LabelPicker";
import styles from "./MessageView.module.css";

interface Props {
  messageId: string;
}

const PARSER_LABELS: Record<string, { label: string; color: string }> = {
  coinbase: { label: "Coinbase", color: "#1652f0" },
  binance: { label: "Binance", color: "#f0b90b" },
  etherscan: { label: "Etherscan", color: "#5d8aaa" },
  indodax: { label: "Indodax", color: "#f15a22" },
};

function formatAmount(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num)) return String(n);
  if (num === 0) return "0";
  if (Math.abs(num) < 0.0001) return num.toExponential(4);
  const fixed = num.toFixed(8).replace(/\.?0+$/, "");
  const [int = "0", dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${withCommas}.${dec}` : withCommas;
}

export function MessageView({ messageId }: Props) {
  const [msg, setMsg] = useState<ApiMessageDetail | null>(null);
  const [receipt, setReceipt] = useState<ApiReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const demoMode = useSelector((s: RootState) => s.auth.demoMode);

  async function handleExportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("chainmail.access");
      const year = new Date().getFullYear();
      const url = `${apiUrl}/api/receipts/export.csv?year=${year}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        alert(`Export failed: HTTP ${res.status}`);
        return;
      }
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      const dispo = res.headers.get("content-disposition") ?? "";
      const match = /filename="?([^"]+)"?/.exec(dispo);
      a.download = match?.[1] ?? `chainmail-receipts-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setExporting(false);
    }
  }

  // Fetch message + receipt
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("chainmail.access");
        const res = await fetch(`${apiUrl}/api/messages/${messageId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { message, receipt: linkedReceipt } = (await res.json()) as {
          message: ApiMessageDetail;
          receipt?: ApiReceipt;
        };
        if (cancelled) return;
        setMsg(message);
        if (linkedReceipt) setReceipt(linkedReceipt);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "unknown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  // W3.5: decrypt the envelope using the unlocked keypair (real user, not demo)
  useEffect(() => {
    if (!msg || !msg.encryptedBody || demoMode || !userId) {
      setDecryptedBody(null);
      return;
    }
    let cancelled = false;
    setDecrypting(true);
    (async () => {
      try {
        const kp = await getUnlockedKey(userId);
        if (!kp) {
          if (!cancelled) setDecryptedBody(null);
          return;
        }
        const plain = await decryptMessageBody(msg.encryptedBody as string, kp);
        if (!cancelled) setDecryptedBody(plain);
      } catch (err) {
        if (!cancelled) {
          console.error("decrypt failed", err);
          setDecryptedBody(null);
        }
      } finally {
        if (!cancelled) setDecrypting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [msg, userId, demoMode]);

  if (loading) return <div className={styles.empty}>Loading…</div>;
  if (error) return <div className={styles.empty}>Failed to load: {error}</div>;
  if (!msg) return <div className={styles.empty}>Message not found</div>;

  const badge = msg.parserKey ? PARSER_LABELS[msg.parserKey] : null;
  const isOutbound = msg.direction === "outbound";

  return (
    <article className={styles.view}>
      {isOutbound && (
        <div
          className={styles.outboundBanner}
          data-status={msg.status}
          role="status"
        >
          <span className={styles.outboundIcon}>→</span>
          <strong>Outbound message</strong>
          <span>
            Status: <code>{msg.status}</code>
            {msg.statusDetail ? ` — ${msg.statusDetail}` : null}
          </span>
          {msg.status === "queued" && (
            <span className={styles.outboundHint}>
              SMTP relay ships in W6 — for now this is stored locally as a queued message.
            </span>
          )}
        </div>
      )}
      <header className={styles.header}>
        {badge && (
          <span
            className={styles.parserBadge}
            style={{ background: badge.color }}
          >
            {badge.label}
          </span>
        )}
        <h1 className={styles.subject}>{msg.subject ?? "(no subject)"}</h1>
        <div className={styles.meta}>
          <strong>{isOutbound ? msg.aliasEmail : msg.fromName ?? msg.fromAddr}</strong>
          {!isOutbound && <span className={styles.fromAddr}>&lt;{msg.fromAddr}&gt;</span>}
          <span>
            to{" "}
            {(msg.toAddrs ?? []).map((a, i) => (
              <span key={a} className={styles.toAddr}>
                {a}
                {i < (msg.toAddrs?.length ?? 0) - 1 ? ", " : ""}
              </span>
            ))}
          </span>
          <span className={styles.timestamp}>
            {new Date(msg.receivedAt).toLocaleString()}
          </span>
        </div>
      </header>

      {receipt && (
        <section className={styles.receipt}>
          <h2 className={styles.receiptTitle}>Parsed receipt</h2>
          <dl className={styles.receiptGrid}>
            <dt>Type</dt>
            <dd>
              <span className={styles.receiptType}>{receipt.type}</span>
            </dd>
            {receipt.amount != null && (
              <>
                <dt>Amount</dt>
                <dd>
                  {formatAmount(receipt.amount)} {receipt.asset}
                </dd>
              </>
            )}
            {receipt.chain && (
              <>
                <dt>Chain</dt>
                <dd>{receipt.chain}</dd>
              </>
            )}
            {receipt.txHash && (
              <>
                <dt>TX hash</dt>
                <dd className={styles.txHash}>{receipt.txHash}</dd>
              </>
            )}
            {receipt.counterparty && (
              <>
                <dt>Counterparty</dt>
                <dd>{receipt.counterparty}</dd>
              </>
            )}
            {receipt.pricePerUnit != null && (
              <>
                <dt>Price / unit</dt>
                <dd>
                  {receipt.pricePerUnit} {receipt.fiat ?? ""}
                </dd>
              </>
            )}
            {receipt.fiatAmount != null && (
              <>
                <dt>Total</dt>
                <dd>
                  {receipt.fiatAmount} {receipt.fiat ?? ""}
                </dd>
              </>
            )}
            {receipt.confidence != null && (
              <>
                <dt>Confidence</dt>
                <dd>{Math.round(receipt.confidence * 100)}%</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <nav className={styles.actions} aria-label="Message actions">
        <button className={styles.iconBtn} title="Reply">↩ Reply</button>
        <button className={styles.iconBtn} title="Forward">↪ Forward</button>
        <button className={styles.iconBtn} title="Move to Trash">🗑</button>
        <button className={styles.iconBtn} title="Mark as Junk">🚩</button>
        <button className={styles.iconBtn} title="Star">☆</button>
        <LabelPicker messageId={msg.id} />
        <span className={styles.spacer} />
        <button
          className={styles.iconBtn}
          title="Export all your receipts as CSV"
          onClick={handleExportCsv}
          disabled={exporting}
        >
          {exporting ? "⏳ Exporting…" : "📊 Export CSV"}
        </button>
      </nav>

      <div className={styles.body}>
        {decryptedBody !== null ? (
          decryptedBody.split("\n").map((line, i) => (
            <p key={i}>{line || "\u00a0"}</p>
          ))
        ) : decrypting ? (
          <p className={styles.empty}>🔐 Decrypting…</p>
        ) : msg.encryptedBody && !demoMode ? (
          <p className={styles.empty}>🔒 Locked. Re-enter your password to read this message.</p>
        ) : (
          (msg.bodyText ?? "(empty body)").split("\n").map((line, i) => (
            <p key={i}>{line || "\u00a0"}</p>
          ))
        )}
      </div>
    </article>
  );
}
