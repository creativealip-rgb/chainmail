import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, isDemoMode } from "@/services/api/client";
import { decryptMessage } from "@/services/crypto/decrypt";
import { useAppSelector } from "@/hooks/redux";
import type { Message } from "@ui/shared-types";
import styles from "./MessageView.module.css";

interface Props {
  mailboxId: string;
  messageId: string;
}

export function MessageView({ mailboxId, messageId }: Props) {
  const [msg, setMsg] = useState<Message | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const keypair = useAppSelector((s) => s.encryption.keypair);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Message>(`mailboxes/${mailboxId}/messages/${messageId}`);
        if (cancelled) return;
        setMsg(data);
        if (keypair && data.ciphertext) {
          const decrypted = await decryptMessage(data.ciphertext, keypair);
          if (!cancelled) setBody(decrypted);
        } else if (isDemoMode() && data) {
          // Demo: render a synthesized body from preview + subject
          if (!cancelled) {
            const lines = [
              `Hi Alip,`,
              ``,
              data.preview,
              ``,
              `— ${data.fromName ?? data.from}`,
              ``,
              `[Demo body — in production this would be decrypted client-side ` +
                `from the ciphertext using your Ed25519/secret key stored in IndexedDB. ` +
                `Decryption never happens on the server.]`,
            ];
            setBody(
              lines
                .map((l) => (l === "" ? "<br/>" : `<p>${escapeHtml(l)}</p>`))
                .join("\n")
            );
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load message", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mailboxId, messageId, keypair]);

  if (loading) return <div className={styles.empty}>Loading…</div>;
  if (!msg) return <div className={styles.empty}>Message not found</div>;

  return (
    <article className={styles.view}>
      <header className={styles.header}>
        <h1 className={styles.subject}>{msg.subject ?? "(no subject)"}</h1>
        <div className={styles.meta}>
          <strong>{msg.fromName ?? msg.from}</strong>
          <span>to {Array.isArray(msg.to) ? msg.to.join(", ") : msg.to}</span>
        </div>
      </header>

      <nav className={styles.actions} aria-label="Message actions">
        <button className={styles.iconBtn} title="Reply">↩ Reply</button>
        <button className={styles.iconBtn} title="Forward">↪ Forward</button>
        <button className={styles.iconBtn} title="Move to Trash">🗑</button>
        <button className={styles.iconBtn} title="Mark as Junk">🚩</button>
        <button className={styles.iconBtn} title="Star">☆</button>
        <span className={styles.spacer} />
        <button className={styles.iconBtn} title="AI Helper">✨ AI Helper</button>
      </nav>

      <div className={styles.body} dangerouslySetInnerHTML={{ __html: body ?? msg.preview ?? "" }} />
    </article>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
