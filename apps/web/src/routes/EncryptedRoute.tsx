/**
 * EncryptedView — recipient-only password-protected email page
 * Reached via /app/encrypted/:key shared in encrypted emails
 * Decrypts body using password-derived key
 */
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { decryptWithPassword } from "@ui/crypto";
import { Logo } from "@/components/brand/Logo";
import styles from "./EncryptedRoute.module.css";

// Conservative HTML sanitizer — strips script/iframe/object/embed/style/link tags
// + any on* event handlers + javascript: URLs. Not a full DOMPurify replacement,
// but enough for trusted-ish encrypted payloads. For untrusted input, prefer
// rendering as text via React's automatic escaping.
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, "")
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export default function EncryptedRoute() {
  const { key } = useParams<{ key: string }>();
  const [password, setPassword] = useState("");
  const [body, setBody] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // Refocus password field after an error so user can retry without clicking
  useEffect(() => {
    if (error) passwordRef.current?.focus();
  }, [error]);

  // Esc clears the field / returns focus to password
  useEffect(() => {
    if (body !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setError(null);
        passwordRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [body]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) {
      setError("Invalid link.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const decrypted = await decryptWithPassword(key, password);
      setBody(decrypted);
    } catch {
      setError("Wrong password or expired link.");
    } finally {
      setLoading(false);
    }
  };

  if (!key) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Logo />
          <h1 className={styles.title}>Invalid link</h1>
          <p className={styles.subtitle}>This encrypted message link is missing its key.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Logo />
        <h1 className={styles.title}>Encrypted message</h1>
        <p className={styles.subtitle}>
          Enter the password the sender shared with you to decrypt this message.
        </p>

        {body !== null ? (
          <div className={styles.bodyWrap}>
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: sanitize(body) }}
            />
            <button
              type="button"
              className={styles.lockAgain}
              onClick={() => {
                setBody(null);
                setPassword("");
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Lock again
            </button>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className={styles.form}>
            <label className={styles.label}>
              <span>Password</span>
              <input
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                className={styles.input}
                aria-invalid={!!error}
                aria-describedby={error ? "encrypted-error" : undefined}
              />
            </label>

            {error && (
              <div id="encrypted-error" className={styles.error} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !password} className={styles.primary}>
              {loading ? "Unlocking…" : "Unlock"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}