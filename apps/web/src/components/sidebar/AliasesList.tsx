import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createAlias } from "@/store/slices/aliasesSlice";
import styles from "./Sidebar.module.css";

export function AliasesList() {
  const dispatch = useAppDispatch();
  const aliases = useAppSelector((s) => s.aliases.list);
  const loading = useAppSelector((s) => s.aliases.loading);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);

  if (aliases.length === 0) {
    return (
      <div className={styles.empty}>
        {isAuth ? "No aliases yet" : "Sign in to create an alias"}
      </div>
    );
  }

  return (
    <>
      <ul className={styles.aliasList}>
        {aliases.map((a) => (
          <li key={a.id} className={styles.aliasItem} title={a.email}>
            <span className={a.active ? styles.aliasDot : styles.aliasDotInactive} />
            <span className={styles.aliasEmail}>{a.email}</span>
          </li>
        ))}
      </ul>
      {isAuth && (
        <button
          className={styles.addAliasButton}
          onClick={() => dispatch(createAlias())}
          disabled={loading}
        >
          {loading ? "Creating…" : "+ New alias"}
        </button>
      )}
    </>
  );
}
