import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { markAllRead } from "@/store/slices/messagesSlice";
import { fetchFolders } from "@/store/slices/foldersSlice";
import styles from "./MailboxView.module.css";

interface Props {
  activeFolder: string;
  activeLabelId: string | null;
  unreadCount: number;
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function ActionToolbar({ activeFolder, activeLabelId, unreadCount }: Props) {
  const dispatch = useAppDispatch();
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);

  const handleMarkAll = async () => {
    if (!isAuth) return;
    if (activeLabelId) {
      await dispatch(markAllRead({ labelId: activeLabelId }));
    } else {
      await dispatch(markAllRead({ folder: activeFolder }));
    }
    // Refetch folders so unread counts refresh
    dispatch(fetchFolders());
  };

  return (
    <nav className={styles.toolbar} aria-label="Message actions">
      <button className={styles.toolbarBtn} disabled>
        <IconCheck /> Select all
      </button>
      <button
        className={styles.toolbarBtn}
        onClick={handleMarkAll}
        disabled={!isAuth || unreadCount === 0}
        title={unreadCount === 0 ? "No unread messages" : `Mark ${unreadCount} as read`}
      >
        <IconMail /> Mark all as read{unreadCount > 0 && ` (${unreadCount})`}
      </button>
      <button className={styles.toolbarBtn} disabled>
        <IconFilter /> Filter
      </button>
    </nav>
  );
}