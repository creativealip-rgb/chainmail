import styles from "./Architecture.module.css";

const LAYERS = [
  { name: "Inbox", tech: "Haraka SMTP", detail: "budi+a7f2@chainmail.app" },
  { name: "Ingest", tech: "BullMQ worker", detail: "raw MIME → message row" },
  { name: "Parser", tech: "packages/parsers", detail: "Coinbase · Binance · Etherscan" },
  { name: "Storage", tech: "Postgres + R2", detail: "encrypted blobs · indexed receipts" },
  { name: "Realtime", tech: "Socket.IO", detail: "receipt:new · folder:unread" },
  { name: "API", tech: "Hono + Drizzle", detail: "api.chainmail.app" },
  { name: "Client", tech: "React + WebCrypto", detail: "decrypts locally · zero plaintext" },
];

export function Architecture() {
  return (
    <section id="architecture">
      <header className={styles.header}>
        <h2>How a receipt flows</h2>
        <p>
          From Coinbase's SMTP server to your searchable archive. Receipt
          parsed in under a second after the email arrives.
        </p>
      </header>

      <div className={styles.layers}>
        {LAYERS.map((l, i) => (
          <div key={l.name} className={styles.layer}>
            <div className={styles.layerIdx}>{String(i + 1).padStart(2, "0")}</div>
            <div className={styles.layerName}>{l.name}</div>
            <code className={styles.layerTech}>{l.tech}</code>
            <div className={styles.layerDetail}>{l.detail}</div>
          </div>
        ))}
      </div>

      <div className={styles.flow}>
        <h3 className={styles.flowTitle}>Data flow</h3>
        <pre className={styles.code}>
{`[Gmail filter]  →  [chainmail.app MX]  →  [Haraka :25]
                                            ↓ raw MIME
                                      [API /api/ingest]
                                            ↓
                                      [BullMQ: parse]
                                            ↓
                                      [packages/parsers]
                                            ↓ normalized Receipt
                                      [Postgres: messages + receipts]
                                            ↓
                                      [WebSocket: push to client]
                                            ↓
                                      [encrypted blob: client decrypts]
                                            ↓
                                      [UI: searchable, tagged, tax-ready]`}
        </pre>
      </div>
    </section>
  );
}
