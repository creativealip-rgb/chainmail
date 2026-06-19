import type { ApiMessage } from "@/store/slices/messagesSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useNavigate } from "react-router-dom";
import { moveMessage, setMessageLabels, fetchMessageDetail, starMessage } from "@/store/slices/messagesSlice";
import { decrementUnread } from "@/store/slices/foldersSlice";
import { LabelPicker } from "@/components/message/LabelPicker";
import { parserMeta } from "@/services/parserRegistry";
import { push as pushToast } from "@/store/slices/notificationsSlice";
import styles from "./MessageList.module.css";

const ICON_PROPS = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconStar({ filled }: { filled: boolean }) {
  return (
    <svg {...ICON_PROPS} fill={filled ? "currentColor" : "none"}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconArchive() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

interface Props {
  messages: ApiMessage[];
}

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

function aliasLocal(email: string | null | undefined): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
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
      dispatch(pushToast({
        type: "success",
        message: m.starred ? "Removed star" : "Starred",
      }));
      return;
    }
    if (action === "trash") {
      dispatch(moveMessage({ id: m.id, folder: "trash" }));
      dispatch(pushToast({ type: "success", message: "Moved to Trash" }));
    }
    if (action === "archive") {
      dispatch(moveMessage({ id: m.id, folder: "archive" }));
      dispatch(pushToast({ type: "success", message: "Archived" }));
    }
    if (action === "spam") {
      dispatch(moveMessage({ id: m.id, folder: "junk" }));
      dispatch(pushToast({ type: "success", message: "Reported as spam" }));
    }
  };

  return (
    <ul className={styles.list}>
      {messages.map((m) => {
        const badge = parserMeta(m.parserKey);
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
                {isOutbound ? (
                  <>to {(m.toAddrs ?? []).join(", ") || "(unknown)"} <span className={styles.via}>via</span> <span className={styles.alias}>{aliasLocal(m.aliasEmail)}</span></>
                ) : (
                  <><span className={styles.senderName}>{m.fromName ?? m.fromAddr}</span> <span className={styles.via}>→</span> <span className={styles.alias}>{aliasLocal(m.aliasEmail)}</span></>
                )}
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
                  <IconStar filled={m.starred} />
                </button>
                <LabelPicker messageId={m.id} compact />
                <button
                  className={styles.actionBtn}
                  title="Archive"
                  onClick={(e) => handleAction(e, "archive", m)}
                  aria-label="Archive message"
                >
                  <IconArchive />
                </button>
                <button
                  className={styles.actionBtn}
                  title="Spam"
                  onClick={(e) => handleAction(e, "spam", m)}
                  aria-label="Mark as spam"
                >
                  <IconFlag />
                </button>
                <button
                  className={styles.actionBtn}
                  title="Trash"
                  onClick={(e) => handleAction(e, "trash", m)}
                  aria-label="Move to trash"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
