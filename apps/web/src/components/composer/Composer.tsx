import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { close, update } from "@/store/slices/composerSlice";
import { sendMessage } from "@/store/slices/messagesSlice";
import { fetchAliases } from "@/store/slices/aliasesSlice";
import { fetchMessages } from "@/store/slices/messagesSlice";
import styles from "./Composer.module.css";

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /.+@.+\..+/.test(s));
}

export function Composer() {
  const dispatch = useAppDispatch();
  const composer = useAppSelector((s) => s.composer);
  const aliases = useAppSelector((s) => s.aliases.list);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);

  // Local string state for recipient fields so user can type freely
  const [toRaw, setToRaw] = useState(composer.to.join(", "));
  const [ccRaw, setCcRaw] = useState(composer.cc.join(", "));
  const [bccRaw, setBccRaw] = useState(composer.bcc.join(", "));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCc, setShowCc] = useState(composer.cc.length > 0);
  const [showBcc, setShowBcc] = useState(composer.bcc.length > 0);

  // Default "from" = first alias (the API will pick the same one if aliasId omitted)
  const fromAlias = useMemo(() => {
    if (composer.draftId) return aliases.find((a: { id: string }) => a.id === composer.draftId);
    return aliases[0] ?? null;
  }, [aliases, composer.draftId]);

  // Load aliases when composer opens (in case we don't have them yet)
  useEffect(() => {
    if (composer.open && aliases.length === 0 && isAuth) {
      dispatch(fetchAliases());
    }
  }, [composer.open, aliases.length, isAuth, dispatch]);

  // Reset local state when composer opens fresh
  useEffect(() => {
    if (composer.open) {
      setToRaw(composer.to.join(", "));
      setCcRaw(composer.cc.join(", "));
      setBccRaw(composer.bcc.join(", "));
      setError(null);
      setShowCc(composer.cc.length > 0);
      setShowBcc(composer.bcc.length > 0);
    }
  }, [composer.open]); // intentionally only on open

  if (!composer.open) return null;

  const handleClose = () => {
    if (sending) return;
    dispatch(close());
  };

  const handleSend = async () => {
    if (sending) return;
    setError(null);
    const to = parseRecipients(toRaw);
    const cc = showCc ? parseRecipients(ccRaw) : [];
    const bcc = showBcc ? parseRecipients(bccRaw) : [];
    if (to.length === 0) {
      setError("At least one recipient required");
      return;
    }
    if (!composer.subject.trim()) {
      setError("Subject required");
      return;
    }
    if (!composer.body.trim()) {
      setError("Body required");
      return;
    }
    setSending(true);
    try {
      const result = await dispatch(
        sendMessage({
          aliasId: fromAlias?.id,
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          subject: composer.subject.trim(),
          bodyText: composer.body,
          bodyHtml: composer.body.replace(/\n/g, "<br>"),
        }),
      );
      if (sendMessage.fulfilled.match(result)) {
        // Refetch sent folder so it shows up there too
        dispatch(fetchMessages({ folder: "sent" }));
        dispatch(close());
      } else {
        setError((result.payload as string) ?? "send failed");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
      >
        <header className={styles.header}>
          <h2 id="composer-title" className={styles.title}>
            New Message
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
            disabled={sending}
          >
            ✕
          </button>
        </header>

        <div className={styles.field}>
          <label className={styles.label}>From</label>
          <div className={styles.fromValue}>
            {fromAlias ? fromAlias.email : "No alias — create one in sidebar"}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="composer-to">
            To
          </label>
          <input
            id="composer-to"
            className={styles.input}
            type="text"
            placeholder="recipient@example.com, another@example.com"
            value={toRaw}
            onChange={(e) => setToRaw(e.target.value)}
            disabled={sending}
          />
        </div>

        {!showCc && !showBcc && (
          <div className={styles.toggleRow}>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowCc(true)}
            >
              Cc
            </button>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowBcc(true)}
            >
              Bcc
            </button>
          </div>
        )}

        {showCc && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="composer-cc">
              Cc
            </label>
            <input
              id="composer-cc"
              className={styles.input}
              type="text"
              placeholder="cc@example.com"
              value={ccRaw}
              onChange={(e) => setCcRaw(e.target.value)}
              disabled={sending}
            />
          </div>
        )}

        {showBcc && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="composer-bcc">
              Bcc
            </label>
            <input
              id="composer-bcc"
              className={styles.input}
              type="text"
              placeholder="bcc@example.com"
              value={bccRaw}
              onChange={(e) => setBccRaw(e.target.value)}
              disabled={sending}
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="composer-subject">
            Subject
          </label>
          <input
            id="composer-subject"
            className={styles.input}
            type="text"
            placeholder="Subject"
            value={composer.subject}
            onChange={(e) => dispatch(update({ subject: e.target.value }))}
            disabled={sending}
          />
        </div>

        <div className={styles.bodyField}>
          <textarea
            id="composer-body"
            className={styles.textarea}
            placeholder="Write your message…"
            value={composer.body}
            onChange={(e) => dispatch(update({ body: e.target.value }))}
            disabled={sending}
          />
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <footer className={styles.footer}>
          <div className={styles.footerHint}>
            🔒 Encrypted at rest · <strong>Queued</strong> for delivery
          </div>
          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={sending}
            >
              Discard
            </button>
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
