/**
 * /app/ledger — tax-year rollup view.
 *
 * Same dashboard layout as MailboxRoute (sidebar + topbar) but content is
 * the LedgerView — per-asset / per-source / per-chain / per-month breakdown
 * fetched from GET /api/ledger/:year.
 */
import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TopBar } from "@/components/topbar/TopBar";
import { LedgerView } from "@/components/ledger/LedgerView";
import { Composer } from "@/components/composer/Composer";
import { useAppSelector } from "@/hooks/redux";

export default function LedgerRoute() {
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <TopBar />
        <div style={{ padding: "var(--space-3) var(--space-5)", display: "flex", alignItems: "center", gap: "var(--space-3)", borderBottom: "1px solid var(--border-subtle)" }}>
          <label htmlFor="ledger-year" style={{ fontSize: "var(--fs-sm)", color: "var(--color-neutral-600)" }}>
            Tax year:
          </label>
          <select
            id="ledger-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "6px 12px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--r-md)",
              background: "var(--bg-base)",
              color: "inherit",
              fontSize: "var(--fs-base)",
            }}
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <LedgerView year={year} isAuth={isAuth} />
      </div>
      <Composer />
    </div>
  );
}