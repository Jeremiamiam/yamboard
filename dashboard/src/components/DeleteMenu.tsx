"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Menu ⋯ avec option "Supprimer" — remplace les icônes poubelle.
 */
export function DeleteMenu({
  onDelete,
  confirmLabel = "Supprimer ?",
  disabled,
  className = "",
}: {
  onDelete: () => void;
  confirmLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  function handleDelete() {
    if (confirm(confirmLabel)) {
      onDelete();
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={disabled}
        className="p-1 rounded text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 text-sm"
        title="Actions"
        aria-label="Menu"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-0.5 py-0.5 min-w-[120px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
