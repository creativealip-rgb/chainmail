import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setSearchQuery } from "@/store/slices/uiSlice";
import { open as openComposer } from "@/store/slices/composerSlice";
import { signOut } from "@/store/slices/authSlice";
import { AvatarMenu } from "./AvatarMenu";
import { ThemeToggle } from "./ThemeToggle";
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
          🎯 DEMO MODE — using seed data, no real API calls
        </div>
      )}
      {auth.isAuthenticated && (
        <div className={styles.liveBadge} role="status">
          🟢 LIVE — {auth.user?.email ?? "signed in"}
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
        <span className={styles.searchIcon} aria-hidden>🔍</span>
        <input
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </form>

      <div className={styles.right}>
        <button className={styles.composeBtn} onClick={() => dispatch(openComposer())}>
          ✎ Compose
        </button>
        <ThemeToggle />
        <AvatarMenu user={user} />
      </div>
    </header>
  );
}
