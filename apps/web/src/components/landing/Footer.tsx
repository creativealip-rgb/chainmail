import { Logo } from "./Logo";
import styles from "./Footer.module.css";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo size={28} />
          <span className={styles.copy}>Chainmail</span>
          <span className={styles.copy}>© {year}</span>
        </div>
        <div className={styles.links}>
          <a href="https://github.com/creativealip-rgb/chainmail" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="https://github.com/creativealip-rgb/chainmail/blob/main/PLAN.md" target="_blank" rel="noreferrer">Roadmap</a>
          <a href="https://github.com/creativealip-rgb/chainmail/blob/main/README.md" target="_blank" rel="noreferrer">README</a>
        </div>
        <p className={styles.note}>
          Open-source under MIT. Built by Alip.
        </p>
      </div>
    </footer>
  );
}
