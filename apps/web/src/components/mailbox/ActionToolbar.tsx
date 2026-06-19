import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { markAllRead } from "@/store/slices/messagesSlice";
import { fetchFolders } from "@/store/slices/foldersSlice";
import { push as pushToast } from "@/store/slices/notificationsSlice";
import styles from "./MailboxView.module.css";

interface Props {
  activeFolder: string;
  activeLabelId: string | null;
  unreadCount: number;
}

function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function ActionToolbar({ activeFolder, activeLabelId, unreadCount }: Props) {
  const dispatch = useAppDispatch();
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const messages = useAppSelector((s) => s.messages.list);

  const handleMarkAll = async () => {
    if (!isAuth) return;
    // Read fresh unread count from current list to avoid stale closure after await
    const freshUnread = messages.filter((m) => !m.readAt).length;
    if (activeLabelId) {
      await dispatch(markAllRead({ labelId: activeLabelId }));
    } else {
      await dispatch(markAllRead({ folder: activeFolder }));
    }
    await dispatch(fetchFolders());
    dispatch(pushToast({
      type: "success",
      message: freshUnread > 0 ? `Marked ${freshUnread} as read` : "Already up to date",
    }));
  };

  return (
    <nav className={styles.toolbar} aria-label="Message actions">
      <button
        className={styles.toolbarBtn}
        onClick={handleMarkAll}
        disabled={!isAuth || unreadCount === 0}
        title={unreadCount === 0 ? "No unread messages" : `Mark ${unreadCount} as read`}
      >
        <IconMail /> Mark all as read{unreadCount > 0 && ` (${unreadCount})`}
      </button>
    </nav>
  );
}