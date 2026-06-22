import { useState, FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { signIn } from "@/store/slices/authSlice";
import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTo = from?.pathname ? `${from.pathname}${from.search ?? ""}` : "/app/mailbox/inbox";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signIn({ email, password }));
    if (signIn.fulfilled.match(result)) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className={styles.authBg}>
    <div className={styles.blobAccent} />
    <div className={styles.authPage}>
      <Logo />
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>Sign in to your Chainmail inbox.</p>

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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={styles.input}
          />
        </label>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <button
          type="submit"
          disabled={status === "loading"}
          className={styles.primary}
        >
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className={styles.altLink}>
        New to Chainmail? <Link to="/app/auth/sign-up">Create an account</Link>
      </p>
    </div>
    </div>
  );
}
