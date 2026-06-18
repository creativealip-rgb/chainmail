import type { ApiMessage } from "@/store/slices/messagesSlice";
import { useNavigate } from "react-router-dom";
import styles from "./MessageList.module.css";

interface Props {
  messages: ApiMessage[];
}

const PARSER_BADGE: Record<string, { label: string; color: string }> = {
  coinbase: { label: "Coinbase", color: "#1652f0" },
  binance: { label: "Binance", color: "#f0b90b" },
  etherscan: { label: "Etherscan", color: "#5d8aaa" },
  indodax: { label: "Indodax", color: "#f15a22" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function MessageList({ messages }: Props) {
  const navigate = useNavigate();
  return (
    <ul className={styles.list}>
      {messages.map((m) => {
        const badge = m.parserKey ? PARSER_BADGE[m.parserKey] : null;
        return (
          <li
            key={m.id}
            className={styles.row}
            onClick={() => navigate(`/app/mailbox/inbox/message/${m.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/app/mailbox/inbox/message/${m.id}`);
              }
            }}
          >
            <div className={styles.left}>
              {badge && (
                <span
                  className={styles.badge}
                  style={{ background: badge.color }}
                  title={`Parsed by ${badge.label}`}
                >
                  {badge.label}
                </span>
              )}
              {!badge && <span className={styles.unparsed} title="No parser matched">—</span>}
            </div>
            <div className={styles.middle}>
              <div className={styles.subject}>
                {m.subject ?? <em>(no subject)</em>}
              </div>
              <div className={styles.from}>
                {m.fromName ?? m.fromAddr} → <span className={styles.alias}>{m.aliasEmail}</span>
              </div>
            </div>
            <div className={styles.right}>
              <time className={styles.time} dateTime={m.receivedAt}>
                {timeAgo(m.receivedAt)}
              </time>
              {m.readAt === null && <span className={styles.unread} aria-label="Unread" />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
