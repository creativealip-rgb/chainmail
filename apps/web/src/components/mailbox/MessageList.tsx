import type { ApiMessage } from "@/store/slices/messagesSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, Fragment } from "react";
import { moveMessage, setMessageLabels, fetchMessageDetail, starMessage } from "@/store/slices/messagesSlice";
import { decrementUnread } from "@/store/slices/foldersSlice";
import { LabelPicker } from "@/components/message/LabelPicker";
import { parserMeta } from "@/services/parserRegistry";
import { push as pushToast } from "@/store/slices/notificationsSlice";
import styles from "./MessageList.module.css";

/* ─── Date grouping ─── */
function getDateGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (diffDays < 7) return "This week";
  if (diffDays < 30) return "Earlier this month";
  return "Older";
}

/* ─── Avatar color from sender name ─── */
const AVATAR_COLORS: string[] = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#ef4444", "#6366f1",
  "#14b8a6", "#f97316",
];
function senderColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] ?? "#3b82f6";
}
function senderInitial(name: string): string {
  return (name || "?").charAt(0).toUpperCase();
}

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
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Clamp activeIndex when message list shrinks (e.g. after trash)
  useEffect(() => {
    if (activeIndex >= messages.length) {
      setActiveIndex(Math.max(0, messages.length - 1));
    }
  }, [messages.length, activeIndex]);

  // Scroll active row into view
  useEffect(() => {
    const row = rowRefs.current[activeIndex];
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // j/k navigation + Enter to open, e to archive, # to trash, s to star
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "j") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(messages.length - 1, i + 1));
      } else if (key === "k") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (key === "arrowdown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(messages.length - 1, i + 1));
      } else if (key === "arrowup") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (key === "enter") {
        const m = messages[activeIndex];
        if (m) {
          e.preventDefault();
          handleOpen(m);
        }
      } else if (key === "e" || key === "#") {
        const m = messages[activeIndex];
        if (m) {
          e.preventDefault();
          const folder = key === "#" ? "trash" : "archive";
          dispatch(moveMessage({ id: m.id, folder }));
          dispatch(pushToast({ type: "success", message: folder === "trash" ? "Moved to Trash" : "Archived" }));
        }
      } else if (key === "s") {
        const m = messages[activeIndex];
        if (m) {
          e.preventDefault();
          dispatch(starMessage({ id: m.id, starred: !m.starred }));
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeIndex, navigate, activeFolder, dispatch]);

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
      const sourceFolder = activeFolder;
      dispatch(moveMessage({ id: m.id, folder: "trash" }));
      dispatch(pushToast({
        type: "success",
        message: "Moved to Trash",
        action: { label: "Undo", type: "button" },
        onUndo: () => {
          dispatch(moveMessage({ id: m.id, folder: sourceFolder }));
          dispatch(pushToast({ type: "info", message: `Restored to ${sourceFolder}` }));
        },
      }));
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

  /* ─── Build date-grouped message list ─── */
  const grouped: { label: string; messages: { msg: ApiMessage; index: number }[] }[] = [];
  let currentGroup = "";
  messages.forEach((m, i) => {
    const group = getDateGroup(m.receivedAt);
    if (group !== currentGroup) {
      currentGroup = group;
      grouped.push({ label: group, messages: [] });
    }
    const last = grouped[grouped.length - 1];
    if (last) last.messages.push({ msg: m, index: i });
  });

  return (
    <ul className={styles.list} ref={listRef}>
      {grouped.map((g) => (
        <Fragment key={g.label}>
          <li className={styles.dateGroup} role="separator">
            <span className={styles.dateGroupLabel}>{g.label}</span>
          </li>
          {g.messages.map(({ msg: m, index: i }) => {
        const badge = parserMeta(m.parserKey);
        const msgLabels = labelsByMessage[m.id] ?? [];
        const isOutbound = m.direction === "outbound";
        const isActive = i === activeIndex;
        return (
          <li
            key={m.id}
            ref={(el) => { rowRefs.current[i] = el; }}
            className={
              `${m.readAt ? styles.row : `${styles.row} ${styles.rowUnread}`}`
              + (isActive ? ` ${styles.rowActive}` : "")
            }
            data-active={isActive ? "true" : undefined}
            onClick={() => { setActiveIndex(i); handleOpen(m); }}
            role="button"
            tabIndex={isActive ? 0 : -1}
            onFocus={() => setActiveIndex(i)}
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
              ) : (
                <span
                  className={styles.senderAvatar}
                  style={{ background: senderColor(m.fromName ?? m.fromAddr ?? "?") }}
                  title={m.fromName ?? m.fromAddr}
                >
                  {senderInitial(m.fromName ?? m.fromAddr)}
                </span>
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
                  title={m.starred ? "Unstar (S)" : "Star (S)"}
                  onClick={(e) => handleAction(e, "star", m)}
                  aria-label={m.starred ? "Unstar message" : "Star message"}
                  aria-pressed={m.starred}
                >
                  <IconStar filled={m.starred} />
                </button>
                <LabelPicker messageId={m.id} compact />
                <button
                  className={styles.actionBtn}
                  title="Archive (E)"
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
                  title="Trash (#)"
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
        </Fragment>
      ))}
    </ul>
  );
}
