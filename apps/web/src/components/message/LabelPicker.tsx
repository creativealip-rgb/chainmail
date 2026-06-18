import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { fetchLabels, createLabel } from "@/store/slices/foldersSlice";
import { setMessageLabels } from "@/store/slices/messagesSlice";
import styles from "./LabelPicker.module.css";

interface Props {
  messageId: string;
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

export function LabelPicker({ messageId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const labels = useSelector((s: RootState) => s.folders.labels);
  const assigned = useSelector(
    (s: RootState) => s.messages.labelsByMessage[messageId] ?? []
  );
  const assignedIds = new Set(assigned.map((l) => l.id));

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0] ?? "#6366f1");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Make sure labels are loaded when the picker opens
  useEffect(() => {
    if (open && labels.length === 0) {
      dispatch(fetchLabels());
    }
  }, [open, labels.length, dispatch]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
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
      // Auto-assign the new label to this message
      const newId = result.payload.id;
      const next = [...Array.from(assignedIds), newId];
      dispatch(setMessageLabels({ id: messageId, labelIds: next }));
      setNewName("");
      setCreating(false);
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        title="Labels"
        aria-haspopup="true"
        aria-expanded={open}
      >
        🏷 Labels
        {assigned.length > 0 && (
          <span className={styles.count}>{assigned.length}</span>
        )}
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
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
                      <span className={styles.check}>{checked ? "✓" : ""}</span>
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
        </div>
      )}
    </div>
  );
}
