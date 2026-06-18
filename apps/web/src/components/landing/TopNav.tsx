import { Link } from "react-router-dom";
import { Logo } from "@/components/landing/Logo";
import styles from "./TopNav.module.css";

export function TopNav() {
  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <Logo size={32} />
        <span className={styles.brandText}>Chainmail</span>
        <span className={styles.beta}>early access</span>
      </Link>

      <nav className={styles.links}>
        <a href="#features">Features</a>
        <a href="#architecture">Architecture</a>
        <a
          href="https://github.com/creativealip-rgb/chainmail"
          target="_blank"
          rel="noreferrer"
        >
          GitHub →
        </a>
        <Link to="/app/auth/sign-in" className={styles.cta}>
          Try demo →
        </Link>
      </nav>
    </header>
  );
}
