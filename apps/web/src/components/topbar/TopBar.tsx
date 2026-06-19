import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setSearchQuery } from "@/store/slices/uiSlice";
import { AvatarMenu } from "./AvatarMenu";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/store/slices/authSlice";
import { isDemoMode } from "@/services/api/client";
import styles from "./TopBar.module.css";

export function TopBar() {
  const dispatch = useAppDispatch();
  const query = useAppSelector((s) => s.ui.searchQuery);
  const user = useAppSelector((s) => s.user.profile);
  const auth = useAppSelector((s) => s.auth);
  const [search, setSearch] = useState(query);

  return (
    <header className={styles.topbar}>
      {isDemoMode() && !auth.isAuthenticated && (
        <div className={styles.demoBadge} role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ verticalAlign: "-2px", marginRight: 6 }}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          DEMO MODE — using seed data, no real API calls
        </div>
      )}
      {auth.isAuthenticated && (
        <div className={styles.liveBadge} role="status">
          <span>LIVE — {auth.user?.email ?? "signed in"}</span>
          <button
            type="button"
            className={styles.signOutBtn}
            onClick={() => dispatch(signOut())}
          >
            sign out
          </button>
        </div>
      )}
      <form
        className={styles.search}
        onSubmit={(e) => {
          e.preventDefault();
          dispatch(setSearchQuery(search));
        }}
      >
        <span className={styles.searchIcon} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </form>

      <div className={styles.right}>
        <ThemeToggle />
        <AvatarMenu user={user} />
      </div>
    </header>
  );
}
