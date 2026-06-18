import { Link } from "react-router-dom";
import { Button } from "@ui/ui";
import styles from "./CallToAction.module.css";

export function CallToAction() {
  return (
    <section className={styles.cta}>
      <h2>See your next receipt, parsed.</h2>
      <p>
        Open the demo. Sample emails from Coinbase, Binance, and Etherscan
        already parsed, encrypted, and waiting. No signup.
      </p>
      <div className={styles.buttons}>
        <Link to="/app/auth/sign-in">
          <Button size="lg">Open demo →</Button>
        </Link>
        <a
          href="https://github.com/creativealip-rgb/chainmail"
          target="_blank"
          rel="noreferrer"
        >
          <Button size="lg" variant="secondary">Star on GitHub</Button>
        </a>
      </div>
      <p className={styles.fineprint}>
        Early access.{" "}
        <a href="https://github.com/creativealip-rgb/chainmail/blob/main/PLAN.md" target="_blank" rel="noreferrer">Roadmap →</a>
      </p>
    </section>
  );
}
