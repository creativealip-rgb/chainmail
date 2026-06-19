import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { signOut } from "@/store/slices/authSlice";
import { lock } from "@/store/slices/encryptionSlice";
import { setPrivacyCenter, setActiveModal } from "@/store/slices/uiSlice";
import type { User } from "@ui/shared-types";
import { Avatar } from "@ui/ui";
import styles from "./TopBar.module.css";

interface Props {
  user: User | null;
}

export function AvatarMenu({ user }: Props) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (e.target instanceof Node && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleSignOut = () => {
    dispatch(lock());
    dispatch(signOut());
    setOpen(false);
  };

  return (
    <div className={styles.avatarMenu} ref={wrapRef}>
      <button
        className={styles.avatarBtn}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup
        aria-label="User menu"
      >
        {user ? <Avatar name={user.email} size={30} /> : <Avatar name="?" size={30} />}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              dispatch(setPrivacyCenter(true));
              setOpen(false);
            }}
          >
            <span className={styles.menuIcon} aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            Privacy Center
          </button>
          <button
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              dispatch(setActiveModal("twoFactorSetup"));
              setOpen(false);
            }}
          >
            <span className={styles.menuIcon} aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
              </svg>
            </span>
            2FA
          </button>
          <button
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              dispatch(setActiveModal("settings"));
              setOpen(false);
            }}
          >
            <span className={styles.menuIcon} aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            Settings
          </button>
          <hr className={styles.divider} />
          <button className={styles.menuItem} role="menuitem" onClick={handleSignOut}>
            <span className={styles.menuIcon} aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </span>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}