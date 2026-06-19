import { Link } from "react-router-dom";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setActive, createLabel, deleteLabel, fetchFolders, fetchLabels } from "@/store/slices/foldersSlice";
import { setPrivacyCenter } from "@/store/slices/uiSlice";
import { push as pushToast } from "@/store/slices/notificationsSlice";
import { FolderItem } from "./FolderItem";
import { LabelItem } from "./LabelItem";
import { AliasesList } from "./AliasesList";
import styles from "./Sidebar.module.css";

const SYSTEM_FALLBACK = [
  { id: "inbox", name: "Inbox" },
  { id: "flagged", name: "Starred" },
  { id: "important", name: "Important" },
  { id: "sent", name: "Sent" },
  { id: "drafts", name: "Drafts" },
  { id: "archive", name: "Archive" },
  { id: "junk", name: "Spam" },
  { id: "trash", name: "Trash" },
];

export function Sidebar() {
  const folders = useAppSelector((s) => s.folders.folders);
  const labels = useAppSelector((s) => s.folders.labels);
  const dispatch = useAppDispatch();
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  // Show system folders from API if available; otherwise static list
  const folderList = folders.length > 0
    ? folders
    : SYSTEM_FALLBACK.map((f) => ({
        id: f.id,
        name: f.name,
        unreadCount: 0,
        kind: "system" as const,
        parentId: null,
      }));

  const handleNewLabel = async () => {
    if (!newLabelName.trim()) return;
    const result = await dispatch(createLabel({ name: newLabelName.trim() }));
    setNewLabelName("");
    setShowNewLabel(false);
    dispatch(fetchLabels());
    if (createLabel.fulfilled.match(result)) {
      dispatch(pushToast({ type: "success", message: `Label "${result.payload.name}" created` }));
    } else {
      dispatch(pushToast({ type: "error", message: "Failed to create label" }));
    }
  };

  return (
    <aside className={styles.sidebar} aria-label="Primary navigation">
      <Link to="/" className={styles.logo}>
        <svg className={styles.logoMark} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2" y="6" width="20" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2.5 8.5 12 14l9.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="3" r="1.6" fill="var(--color-brand-blue)" />
        </svg>
        <span className={styles.logoText}>Chainmail</span>
        <span className={styles.beta}>beta</span>
      </Link>

      <Link to="/app/mailbox/inbox" className={styles.compose} onClick={() => dispatch(setActive("inbox"))}>
        <svg className={styles.composeIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <span className={styles.composeLabel}>Compose</span>
      </Link>

      <button className={styles.privacyCenter} onClick={() => dispatch(setPrivacyCenter(true))}>
        <svg className={styles.menuIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className={styles.privacyLabel}>PRIVACY CENTER</span>
      </button>

      <Link
        to="/app/ledger"
        className={styles.ledgerLink}
        onClick={() => dispatch(setActive("all"))}
        title="Tax-year rollup — see all your parsed receipts by year"
      >
        <span className={styles.menuIcon} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <rect x="7" y="12" width="3" height="6" />
            <rect x="12" y="8" width="3" height="10" />
            <rect x="17" y="5" width="3" height="13" />
          </svg>
        </span>
        <span className={styles.ledgerLabel}>Ledger</span>
      </Link>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>FOLDERS</span>
        </div>
        <ul className={styles.folderList}>
          {folderList.map((f) => (
            <FolderItem
              key={f.id}
              folder={{
                id: f.id,
                name: f.name,
                kind: "system",
                unreadCount: f.unreadCount ?? 0,
                parentId: null,
              }}
              count={f.unreadCount ?? 0}
            />
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>LABELS</span>
          <button
            className={styles.addButton}
            aria-label="Add label"
            onClick={() => setShowNewLabel((v) => !v)}
            disabled={!isAuth}
          >
            +
          </button>
        </div>
        {showNewLabel && (
          <div className={styles.newLabelForm}>
            <input
              autoFocus
              type="text"
              placeholder="Label name"
              value={newLabelName}
              maxLength={40}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNewLabel();
                if (e.key === "Escape") setShowNewLabel(false);
              }}
              className={styles.newLabelInput}
            />
            <button
              className={styles.newLabelSubmit}
              onClick={handleNewLabel}
              disabled={!newLabelName.trim()}
              aria-label="Confirm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12l5 5L20 7" />
              </svg>
            </button>
          </div>
        )}
        {labels.length === 0 && !showNewLabel ? (
          <div className={styles.empty}>No labels yet</div>
        ) : (
          <ul className={styles.folderList}>
            {labels.map((l) => (
              <LabelItem
                key={l.id}
                label={l}
                count={l.unreadCount}
                onDelete={async () => {
                  const result = await dispatch(deleteLabel(l.id));
                  if (deleteLabel.fulfilled.match(result)) {
                    dispatch(pushToast({ type: "success", message: `Label "${l.name}" deleted` }));
                  } else {
                    dispatch(pushToast({ type: "error", message: "Failed to delete label" }));
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>ALIASES</span>
          <button className={styles.addButton} aria-label="Add alias">+</button>
        </div>
        <AliasesList />
      </div>
    </aside>
  );
}
