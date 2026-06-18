import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchMessages } from "@/store/slices/messagesSlice";
import { fetchAliases } from "@/store/slices/aliasesSlice";
import { MessageList } from "./MessageList";
import { ActionToolbar } from "./ActionToolbar";
import styles from "./MailboxView.module.css";

interface Props {
  mailboxId: string;
}

export function MailboxView({ mailboxId }: Props) {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((s) => s.messages);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const demoMode = useAppSelector((s) => s.auth.demoMode) || import.meta.env.VITE_DEMO === "true";

  useEffect(() => {
    if (isAuth && !demoMode) {
      dispatch(fetchMessages());
      dispatch(fetchAliases());
    }
  }, [dispatch, isAuth, demoMode]);

  if (!isAuth && !demoMode) {
    return <div className={styles.empty}>Sign in to view your inbox.</div>;
  }

  if (loading) return <div className={styles.empty}>Loading…</div>;
  if (error) return <div className={styles.empty}>Failed to load: {error}</div>;
  if (list.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No messages yet.</p>
        <p className={styles.hint}>
          Create an alias in the sidebar, set up a Gmail filter, and forward your first crypto email.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <ActionToolbar />
      <MessageList messages={list} />
    </div>
  );
}
