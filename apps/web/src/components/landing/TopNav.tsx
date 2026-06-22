import { Link } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/landing/Logo";
import styles from "./TopNav.module.css";

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <Logo size={32} />
        <span className={styles.brandText}>Chainmail</span>
        <span className={styles.beta}>demo live</span>
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

      {/* Mobile hamburger */}
      <button
        type="button"
        className={styles.hamburger}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {menuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Navigation menu">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#architecture" onClick={() => setMenuOpen(false)}>Architecture</a>
          <a href="https://github.com/creativealip-rgb/chainmail" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>GitHub →</a>
          <Link to="/app/auth/sign-in" className={styles.cta} onClick={() => setMenuOpen(false)}>Try demo →</Link>
        </div>
      )}
    </header>
  );
}
