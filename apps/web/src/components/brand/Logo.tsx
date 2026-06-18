import styles from "./Logo.module.css";

interface Props {
  size?: number;
  withText?: boolean;
}

/**
 * Chainmail weave logo — 4 interlocking rings in 2×2 grid.
 * Concept: medieval mail armor × crypto chain links.
 * Stroke: teal → blue → purple gradient.
 */
export function Logo({ size = 32, withText = false }: Props) {
  return (
    <span className={styles.wrap} style={{ fontSize: size }}>
      <svg
        className={styles.mark}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Chainmail"
      >
        <defs>
          <linearGradient id="chainGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0CE884" />
            <stop offset="50%" stopColor="#067DF7" />
            <stop offset="100%" stopColor="#6648FF" />
          </linearGradient>
        </defs>
        {/* Four rings in 2×2 grid — non-overlapping, distinct gaps for clarity at small sizes */}
        <circle cx="10" cy="10" r="5.5" stroke="url(#chainGrad)" strokeWidth="2" fill="none" />
        <circle cx="22" cy="10" r="5.5" stroke="url(#chainGrad)" strokeWidth="2" fill="none" />
        <circle cx="10" cy="22" r="5.5" stroke="url(#chainGrad)" strokeWidth="2" fill="none" />
        <circle cx="22" cy="22" r="5.5" stroke="url(#chainGrad)" strokeWidth="2" fill="none" />
        {/* Center accent — the "link" that ties the 4 rings together */}
        <circle cx="16" cy="16" r="2.5" fill="url(#chainGrad)" />
      </svg>
      {withText && <span className={styles.text}>Chainmail</span>}
    </span>
  );
}
