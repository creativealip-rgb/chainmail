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
        {user ? <Avatar name={user.email} size={32} /> : <Avatar name="?" size={32} />}
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
            <span className={styles.menuIcon} aria-hidden>🔒</span>
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
            <span className={styles.menuIcon} aria-hidden>🛡</span>
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
            <span className={styles.menuIcon} aria-hidden>⚙</span>
            Settings
          </button>
          <hr className={styles.divider} />
          <button className={styles.menuItem} role="menuitem" onClick={handleSignOut}>
            <span className={styles.menuIcon} aria-hidden>⤴</span>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}