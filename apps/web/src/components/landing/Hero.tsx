import { Link } from "react-router-dom";
import { Button } from "@ui/ui";
import { Logo } from "@/components/landing/Logo";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.badge}>
        <span className={styles.dot} />
        <span>Early access</span>
      </div>

      <h1 className={styles.title}>
        Your crypto receipts.
        <br />
        <span className={styles.gradient}>Parsed, encrypted, tax-ready.</span>
      </h1>

      <p className={styles.subtitle}>
        Forward emails from Coinbase, Binance, OpenSea, Etherscan. Chainmail
        turns them into a searchable archive and a Koinly-compatible CSV.
        Gmail stays primary.
      </p>

      <div className={styles.cta}>
        <Link to="/app/auth/sign-in">
          <Button size="lg">Try the demo →</Button>
        </Link>
        <a
          href="https://github.com/creativealip-rgb/chainmail"
          target="_blank"
          rel="noreferrer"
        >
          <Button size="lg" variant="secondary">Read source</Button>
        </a>
      </div>

      <div className={styles.preview}>
        <div className={styles.window}>
          <div className={styles.windowBar}>
            <span className={styles.dotR} />
            <span className={styles.dotY} />
            <span className={styles.dotG} />
            <span className={styles.url}>chainmail.168-144-37-19.sslip.io/app</span>
          </div>
          <div className={styles.windowBody}>
            <div className={styles.miniSidebar}>
              <Logo size={20} />
              <div className={styles.miniCompose}>Compose</div>
              <div className={styles.miniFolders}>
                <div className={styles.miniFolder} data-active="true">📥 Inbox 1</div>
                <div className={styles.miniFolder}>📤 Sent</div>
                <div className={styles.miniFolder}>📝 Drafts</div>
                <div className={styles.miniFolder}>🚩 Junk</div>
                <div className={styles.miniFolder}>🗑 Trash</div>
              </div>
            </div>
            <div className={styles.miniList}>
              <div className={styles.miniRow} data-unread="true">
                <span className={styles.miniAvatar} style={{ background: "linear-gradient(135deg,#0CE884,#067DF7)" }}>C</span>
                <div>
                  <div className={styles.miniSender}>Coinbase</div>
                  <div className={styles.miniSubject}>Bought 0.5 BTC · $32,145.00</div>
                </div>
                <div className={styles.miniTime}>16:01</div>
              </div>
              <div className={styles.miniRow}>
                <span className={styles.miniAvatar} style={{ background: "linear-gradient(135deg,#FBBC04,#FB8C00)" }}>B</span>
                <div>
                  <div className={styles.miniSender}>Binance</div>
                  <div className={styles.miniSubject}>Deposit 1,000 USDT received</div>
                </div>
                <div className={styles.miniTime}>11.04</div>
              </div>
              <div className={styles.miniRow}>
                <span className={styles.miniAvatar} style={{ background: "linear-gradient(135deg,#7DCFFF,#6648FF)" }}>E</span>
                <div>
                  <div className={styles.miniSender}>Etherscan</div>
                  <div className={styles.miniSubject}>Tx 0x7a3f...d92e · Confirmed</div>
                </div>
                <div className={styles.miniTime}>11.04</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
