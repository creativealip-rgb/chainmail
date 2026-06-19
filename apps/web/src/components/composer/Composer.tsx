import { useEffect, useMemo, useRef, useState } from "react";
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
  const toRef = useRef<HTMLInputElement | null>(null);

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
      // Autofocus the "To" field on next tick so the modal is mounted first
      const t = window.setTimeout(() => toRef.current?.focus(), 0);
      // Lock background scroll while the modal is open
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    }
    return undefined;
  }, [composer.open]); // intentionally only on open

  // Escape to close — only attached while open
  useEffect(() => {
    if (!composer.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) dispatch(close());
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [composer.open, sending, dispatch]);

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
            ref={toRef}
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ verticalAlign: '-2px', marginRight: 4 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Encrypted at rest · <strong>Queued</strong> for delivery
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
