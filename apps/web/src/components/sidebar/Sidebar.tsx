import { Link } from "react-router-dom";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setActive, createLabel, deleteLabel, fetchFolders, fetchLabels } from "@/store/slices/foldersSlice";
import { setPrivacyCenter } from "@/store/slices/uiSlice";
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
    await dispatch(createLabel({ name: newLabelName.trim() }));
    setNewLabelName("");
    setShowNewLabel(false);
    dispatch(fetchLabels());
  };

  return (
    <aside className={styles.sidebar} aria-label="Primary navigation">
      <Link to="/" className={styles.logo}>
        <span className={styles.logoMark}>⚛</span>
        <span className={styles.logoText}>Chainmail</span>
        <span className={styles.beta}>beta</span>
      </Link>

      <Link to="/app/mailbox/inbox" className={styles.compose} onClick={() => dispatch(setActive("inbox"))}>
        <span className={styles.composeIcon}>✎</span>
        Compose
      </Link>

      <button className={styles.privacyCenter} onClick={() => dispatch(setPrivacyCenter(true))}>
        🔒 PRIVACY CENTER
      </button>

      <Link
        to="/app/ledger"
        className={styles.privacyCenter}
        onClick={() => dispatch(setActive("all"))}
        title="Tax-year rollup — see all your parsed receipts by year"
      >
        📊 LEDGER
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
            >
              ✓
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
                onDelete={() => dispatch(deleteLabel(l.id))}
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
