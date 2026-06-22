import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAppDispatch } from "@/hooks/redux";
import { clearRecoveryCode } from "@/store/slices/authSlice";
import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

interface LocationState {
  recoveryCode?: string;
  email?: string;
}

export default function RecoverySetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const state = (location.state ?? {}) as LocationState;
  const recoveryCode = state.recoveryCode ?? "";
  const email = state.email ?? "";
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showWords, setShowWords] = useState(true);

  if (!recoveryCode) {
    // User landed here without a code (e.g. refreshed). Bounce to sign-in.
    return (
      <div className={styles.authPage}>
        <Logo />
        <h1 className={styles.title}>No recovery code</h1>
        <p className={styles.subtitle}>
          A recovery code is generated only during sign-up. If you need to set up
          a new code, sign in and go to Settings.
        </p>
        <Link to="/app/auth/sign-in" className={styles.primary}>
          Go to sign in
        </Link>
      </div>
    );
  }

  const words = recoveryCode.split(" ");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const onContinue = () => {
    if (!acknowledged) return;
    dispatch(clearRecoveryCode());
    navigate("/app/mailbox/inbox", { replace: true });
  };

  return (
    <div className={styles.authBg}>
    <div className={styles.authPage}>
      <Logo />
      <h1 className={styles.title}>Save your recovery code</h1>
      <p className={styles.subtitle}>
        This 12-word phrase is the <strong>only way</strong> to recover your
        encrypted inbox if you forget your password. We can't reset it for you.
      </p>

      <div className={styles.recoveryWarning} role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <strong>Write this down or store it in a password manager.</strong>
          <br />
          If you lose both your password <em>and</em> this code, your encrypted
          messages are gone forever — even we can't read them.
        </div>
      </div>

      <div className={styles.recoveryBox}>
        {showWords ? (
          <ol className={styles.wordList}>
            {words.map((w, i) => (
              <li key={i} className={styles.wordItem}>
                <span className={styles.wordNum}>{i + 1}</span>
                <span className={styles.wordText}>{w}</span>
              </li>
            ))}
          </ol>
        ) : (
          <code className={styles.codeText}>{recoveryCode}</code>
        )}
      </div>

      <div className={styles.recoveryActions}>
        <button
          type="button"
          onClick={() => setShowWords((s) => !s)}
          className={styles.secondary}
        >
          {showWords ? "Show as text" : "Show as list"}
        </button>
        <button
          type="button"
          onClick={copy}
          className={styles.secondary}
        >
          {copied ? (
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ verticalAlign: "-2px", marginRight: 6 }}>
                <path d="M5 12l5 5L20 7" />
              </svg>
              Copied
            </span>
          ) : (
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ verticalAlign: "-2px", marginRight: 6 }}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <span>
          I have saved my recovery code in a safe place.
        </span>
      </label>

      <button
        type="button"
        disabled={!acknowledged}
        onClick={onContinue}
        className={styles.primary}
      >
        Continue to inbox →
      </button>

      <p className={styles.altLink}>
        Signed up as <strong>{email}</strong>.{" "}
        <Link to="/app/auth/sign-in">Sign in as a different user</Link>
      </p>
    </div>
    </div>
  );
}
