import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchMessages, moveMessage } from "@/store/slices/messagesSlice";
import { fetchAliases } from "@/store/slices/aliasesSlice";
import { fetchFolders, fetchLabels } from "@/store/slices/foldersSlice";
import { MessageList } from "./MessageList";
import { ActionToolbar } from "./ActionToolbar";
import styles from "./MailboxView.module.css";

interface Props {
  mailboxId: string;
  labelId?: string;
}

export function MailboxView({ mailboxId, labelId }: Props) {
  const dispatch = useAppDispatch();
  const { list, loading, error, activeFolder, activeLabelId } = useAppSelector((s) => s.messages);
  const folderList = useAppSelector((s) => s.folders.folders);
  const labelList = useAppSelector((s) => s.folders.labels);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const demoMode = useAppSelector((s) => s.auth.demoMode) || import.meta.env.VITE_DEMO === "true";

  // Refetch whenever the active folder/label changes
  useEffect(() => {
    if (isAuth && !demoMode) {
      dispatch(fetchMessages({ folder: labelId ? undefined : mailboxId, labelId }));
    }
  }, [dispatch, isAuth, demoMode, mailboxId, labelId]);

  // Load sidebar data on mount + when auth becomes true
  useEffect(() => {
    if (isAuth && !demoMode) {
      dispatch(fetchAliases());
      dispatch(fetchFolders());
      dispatch(fetchLabels());
    }
  }, [dispatch, isAuth, demoMode]);

  if (!isAuth && !demoMode) {
    return <div className={styles.empty}>Sign in to view your inbox.</div>;
  }

  if (loading && list.length === 0) return <div className={styles.empty}>Loading…</div>;
  if (error) return <div className={styles.empty}>Failed to load: {error}</div>;

  // Determine current view title
  const folderObj = folderList.find((f) => f.id === activeFolder);
  const labelObj = labelList.find((l) => l.id === activeLabelId);
  const viewTitle = labelObj
    ? `Label: ${labelObj.name}`
    : folderObj
    ? folderObj.name
    : mailboxId === "all"
    ? "All Mail"
    : mailboxId;

  const emptyHint = labelId
    ? "Apply this label to a message from the message view."
    : mailboxId === "inbox"
    ? "Forward your first crypto receipt to your alias — it will appear here in real time."
    : "Nothing here yet.";

  const emptyIllustration =
    mailboxId === "inbox" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ) : mailboxId === "sent" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ) : mailboxId === "drafts" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ) : mailboxId === "trash" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      </svg>
    ) : mailboxId === "junk" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ) : mailboxId === "archive" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ) : mailboxId === "starred" || mailboxId === "flagged" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ) : mailboxId === "important" ? (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ) : (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    );

  const inboxSteps =
    mailboxId === "inbox" ? [
      "Create an alias in the sidebar",
      "Set up a Gmail filter to forward crypto receipts",
      "Watch parsed transactions appear in real time",
    ] : null;

  return (
    <div className={styles.view}>
      <div className={styles.viewHeader}>
        <h1 className={styles.viewTitle}>{viewTitle}</h1>
        <span className={styles.viewCount}>{list.length}</span>
      </div>
      <ActionToolbar
        activeFolder={activeFolder}
        activeLabelId={activeLabelId}
        unreadCount={list.filter((m) => !m.readAt).length}
      />
      {list.length === 0 ? (
        <div className={styles.empty} data-testid="empty-state">
          <div className={styles.emptyIllustration} aria-hidden>
            {emptyIllustration}
          </div>
          <p className={styles.emptyTitle}>Your inbox is empty</p>
          <p className={styles.hint}>{emptyHint}</p>
          {inboxSteps && (
            <ol className={styles.steps}>
              {inboxSteps.map((s, i) => (
                <li key={i} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : (
        <MessageList messages={list} />
      )}
    </div>
  );
}
