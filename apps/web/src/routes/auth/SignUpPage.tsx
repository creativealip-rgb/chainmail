import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { signUp } from "@/store/slices/authSlice";
import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    const result = await dispatch(signUp({ email, password }));
    if (signUp.fulfilled.match(result)) {
      const recoveryCode = result.payload.recoveryCode ?? null;
      if (recoveryCode) {
        // W3.5: show one-time recovery code screen before entering inbox
        navigate("/app/setup-recovery", {
          replace: true,
          state: { recoveryCode, email: result.payload.user.email },
        });
      } else {
        navigate("/app/mailbox/inbox", { replace: true });
      }
    }
  };

  return (
    <div className={styles.authBg}>
    <div className={styles.authPage}>
      <Logo />
      <h1 className={styles.title}>Create your Chainmail account</h1>
      <p className={styles.subtitle}>Encrypted inbox for crypto receipts. 30-second setup.</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.label}>
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          <span>Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          <span>Confirm password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className={styles.input}
          />
        </label>

        {password !== confirm && confirm.length > 0 && (
          <div className={styles.warn}>Passwords do not match</div>
        )}
        {error && <div className={styles.error} role="alert">{error}</div>}

        <button
          type="submit"
          disabled={status === "loading" || password !== confirm}
          className={styles.primary}
        >
          {status === "loading" ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className={styles.altLink}>
        Already have an account? <Link to="/app/auth/sign-in">Sign in</Link>
      </p>
    </div>
    </div>
  );
}
