import type { ApiMessage } from "@/store/slices/messagesSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useNavigate } from "react-router-dom";
import { moveMessage, setMessageLabels, fetchMessageDetail, starMessage } from "@/store/slices/messagesSlice";
import { decrementUnread } from "@/store/slices/foldersSlice";
import { LabelPicker } from "@/components/message/LabelPicker";
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
  const dispatch = useAppDispatch();
  const activeFolder = useAppSelector((s) => s.messages.activeFolder);
  const labels = useAppSelector((s) => s.folders.labels);
  const labelsByMessage = useAppSelector((s) => s.messages.labelsByMessage);

  const handleOpen = (m: ApiMessage) => {
    if (!m.readAt) {
      // Decrement unread in current folder
      dispatch(decrementUnread(activeFolder));
    }
    navigate(`/app/mailbox/${activeFolder}/message/${m.id}`);
  };

  const handleAction = (e: React.MouseEvent, action: "trash" | "archive" | "spam" | "star", m: ApiMessage) => {
    e.stopPropagation();
    if (action === "star") {
      dispatch(starMessage({ id: m.id, starred: !m.starred }));
      return;
    }
    if (action === "trash") dispatch(moveMessage({ id: m.id, folder: "trash" }));
    if (action === "archive") dispatch(moveMessage({ id: m.id, folder: "archive" }));
    if (action === "spam") dispatch(moveMessage({ id: m.id, folder: "junk" }));
  };

  return (
    <ul className={styles.list}>
      {messages.map((m) => {
        const badge = m.parserKey ? PARSER_BADGE[m.parserKey] : null;
        const msgLabels = labelsByMessage[m.id] ?? [];
        const isOutbound = m.direction === "outbound";
        return (
          <li
            key={m.id}
            className={m.readAt ? styles.row : `${styles.row} ${styles.rowUnread}`}
            onClick={() => handleOpen(m)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpen(m);
              }
            }}
          >
            <div className={styles.left}>
              {isOutbound ? (
                <span
                  className={styles.dirBadge}
                  style={{ background: "#3a3a45", color: "#cfcfd6" }}
                  title="Outbound (sent from your alias)"
                >
                  →
                </span>
              ) : badge ? (
                <span
                  className={styles.badge}
                  style={{ background: badge.color }}
                  title={`Parsed by ${badge.label}`}
                >
                  {badge.label}
                </span>
              ) : (
                <span className={styles.unparsed} title="No parser matched">—</span>
              )}
            </div>
            <div className={styles.middle}>
              <div className={styles.subject}>
                {m.subject ?? <em>(no subject)</em>}
                {isOutbound && (
                  <span
                    className={styles.statusChip}
                    data-status={m.status}
                    title={m.statusDetail ?? m.status}
                  >
                    {m.status}
                  </span>
                )}
              </div>
              <div className={styles.from}>
                {isOutbound
                  ? `to ${(m.toAddrs ?? []).join(", ") || "(unknown)"} · via ${m.aliasEmail}`
                  : `${m.fromName ?? m.fromAddr} → ${m.aliasEmail}`}
              </div>
              {msgLabels.length > 0 && (
                <div className={styles.labels}>
                  {msgLabels.map((l) => (
                    <span key={l.id} className={styles.labelChip} style={{ background: l.color }}>
                      {l.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.right}>
              <time className={styles.time} dateTime={m.receivedAt}>
                {timeAgo(m.receivedAt)}
              </time>
              {!m.readAt && <span className={styles.unread} aria-label="Unread" />}
              <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                <button
                  className={m.starred ? `${styles.actionBtn} ${styles.starred}` : styles.actionBtn}
                  title={m.starred ? "Unstar" : "Star"}
                  onClick={(e) => handleAction(e, "star", m)}
                  aria-label={m.starred ? "Unstar message" : "Star message"}
                  aria-pressed={m.starred}
                >
                  {m.starred ? "★" : "☆"}
                </button>
                <LabelPicker messageId={m.id} compact />
                <button
                  className={styles.actionBtn}
                  title="Archive"
                  onClick={(e) => handleAction(e, "archive", m)}
                >
                  ⌫
                </button>
                <button
                  className={styles.actionBtn}
                  title="Spam"
                  onClick={(e) => handleAction(e, "spam", m)}
                >
                  ⚑
                </button>
                <button
                  className={styles.actionBtn}
                  title="Trash"
                  onClick={(e) => handleAction(e, "trash", m)}
                >
                  🗑
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
