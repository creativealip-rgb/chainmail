import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { fetchLabels, createLabel } from "@/store/slices/foldersSlice";
import { setMessageLabels } from "@/store/slices/messagesSlice";
import styles from "./LabelPicker.module.css";

interface Props {
  messageId: string;
  /** Show as a small icon button (for rows) instead of a full bar button */
  compact?: boolean;
}

const PRESET_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

export function LabelPicker({ messageId, compact = false }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const labels = useSelector((s: RootState) => s.folders.labels);
  const assigned = useSelector(
    (s: RootState) => s.messages.labelsByMessage[messageId] ?? []
  );
  const assignedIds = new Set(assigned.map((l) => l.id));

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0] ?? "#6366f1");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Lazy-load labels
  useEffect(() => {
    if (open && labels.length === 0) {
      dispatch(fetchLabels());
    }
  }, [open, labels.length, dispatch]);

  // Position dropdown relative to trigger
  function computePosition() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const dropdownW = 240;
    const dropdownH = 280; // estimate
    let left = r.left;
    let top = r.bottom + 4;
    if (left + dropdownW > window.innerWidth) {
      left = window.innerWidth - dropdownW - 8;
    }
    if (top + dropdownH > window.innerHeight) {
      top = r.top - dropdownH - 4;
    }
    setPos({ top: Math.max(4, top), left: Math.max(4, left) });
  }

  function handleOpen() {
    if (!open) computePosition();
    setOpen((v) => !v);
    setCreating(false);
  }

  // Close on outside click / Escape / scroll
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
      setCreating(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setCreating(false);
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function toggleLabel(labelId: string) {
    const next = assignedIds.has(labelId)
      ? assigned.filter((l) => l.id !== labelId).map((l) => l.id)
      : [...assigned.map((l) => l.id), labelId];
    dispatch(setMessageLabels({ id: messageId, labelIds: next }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const result = await dispatch(createLabel({ name, color: newColor }));
    if (createLabel.fulfilled.match(result)) {
      const newId = result.payload.id;
      const next = [...Array.from(assignedIds), newId];
      dispatch(setMessageLabels({ id: messageId, labelIds: next }));
      setNewName("");
      setCreating(false);
    }
  }

  const triggerClass = compact
    ? `${styles.trigger} ${styles.triggerCompact}`
    : styles.trigger;
  const triggerLabel = compact ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ) : (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
      Labels
    </span>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        onClick={handleOpen}
        title="Labels"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {triggerLabel}
        {assigned.length > 0 && (
          <span className={styles.count}>{assigned.length}</span>
        )}
      </button>
      {open && pos &&
        createPortal(
          <div
            ref={dropdownRef}
            className={styles.dropdown}
            style={{ top: pos.top, left: pos.left }}
            role="menu"
          >
            <div className={styles.heading}>Apply label</div>
            {labels.length === 0 ? (
              <div className={styles.empty}>No labels yet</div>
            ) : (
              <ul className={styles.list}>
                {labels.map((l) => {
                  const checked = assignedIds.has(l.id);
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        className={styles.item}
                        onClick={() => toggleLabel(l.id)}
                        role="menuitemcheckbox"
                        aria-checked={checked}
                      >
                        <span
                          className={styles.dot}
                          style={{ background: l.color }}
                          aria-hidden="true"
                        />
                        <span className={styles.name}>{l.name}</span>
                        <span className={styles.check}>
                          {checked ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={styles.divider} />
            {creating ? (
              <form className={styles.createForm} onSubmit={handleCreate}>
                <input
                  type="text"
                  className={styles.createInput}
                  placeholder="New label name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  maxLength={32}
                />
                <div className={styles.colorRow}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={
                        c === newColor
                          ? `${styles.colorSwatch} ${styles.colorSwatchActive}`
                          : styles.colorSwatch
                      }
                      style={{ background: c }}
                      onClick={() => setNewColor(c)}
                      aria-label={`color ${c}`}
                    />
                  ))}
                </div>
                <div className={styles.createActions}>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className={styles.createBtn}
                onClick={() => setCreating(true)}
              >
                + New label
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
