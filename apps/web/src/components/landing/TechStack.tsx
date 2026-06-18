import styles from "./TechStack.module.css";

const STACK = [
  {
    layer: "Web",
    items: ["React 19", "Vite 6", "TypeScript 5.7", "pnpm workspaces"],
  },
  {
    layer: "UI",
    items: ["Radix primitives", "CSS Modules", "Storybook 8.4"],
  },
  {
    layer: "State",
    items: ["Redux Toolkit", "react-redux", "socket.io-client"],
  },
  {
    layer: "Crypto",
    items: ["WebCrypto", "AES-GCM-256", "Ed25519", "secp256k1", "scrypt"],
  },
  {
    layer: "Storage",
    items: ["localforage", "IndexedDB", "encrypted blobs"],
  },
  {
    layer: "Editor",
    items: ["Jodit WYSIWYG", "Slate (advanced)"],
  },
];

export function TechStack() {
  return (
    <section id="stack">
      <header className={styles.header}>
        <h2>Built with</h2>
        <p>
          Same primitives you would pick for a production encrypted email
          client, minus the vendor lock-in.
        </p>
      </header>

      <div className={styles.grid}>
        {STACK.map((row) => (
          <div key={row.layer} className={styles.row}>
            <div className={styles.layer}>{row.layer}</div>
            <div className={styles.items}>
              {row.items.map((item) => (
                <span key={item} className={styles.item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
