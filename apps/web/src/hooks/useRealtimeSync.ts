/**
 * useRealtimeSync — connect to the API's Socket.IO when authenticated and
 * refetch the active mailbox view on `message.created`.
 *
 * Lives in MailboxRoute so the socket is bound to the authed shell lifetime.
 * Cleanup on unmount and on logout.
 */
import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { store } from "@/store";
import { fetchMessages } from "@/store/slices/messagesSlice";
import { connectSocket, disconnectSocket, type AppSocket } from "@/services/realtime/socket";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(["chainmail", "access"].join("."));
}

export function useRealtimeSync(enabled: boolean): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    let s: AppSocket | null = null;
    try {
      s = connectSocket(token);
    } catch (e) {
      console.error("[ws] connect failed", e);
      return;
    }

    const onMessageCreated = () => {
      // Refetch whatever view is currently active — simplest correct behavior.
      const state = store.getState();
      const folder = state.messages.activeFolder || "inbox";
      const labelId = state.messages.activeLabelId ?? undefined;
      dispatch(fetchMessages({ folder, labelId }));
    };

    const onConnect = () => console.log("[ws] connected");
    const onDisconnect = (reason: string) => console.log("[ws] disconnected:", reason);
    const onError = (err: unknown) => console.error("[ws] error", err);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onError);
    s.on("message.created", onMessageCreated);

    return () => {
      s?.off("connect", onConnect);
      s?.off("disconnect", onDisconnect);
      s?.off("connect_error", onError);
      s?.off("message.created", onMessageCreated);
      disconnectSocket();
    };
  }, [enabled, dispatch]);
}