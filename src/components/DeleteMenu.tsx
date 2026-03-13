"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";

/**
 * Menu ⋯ avec option "Supprimer" — remplace les icônes poubelle.
 * Rendu en portal pour éviter le clipping (overflow) et les conflits de z-index.
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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

  const rect = ref.current?.getBoundingClientRect();
  const menuStyle =
    rect && typeof document !== "undefined"
      ? {
          position: "fixed" as const,
          top: rect.bottom + 4,
          left: Math.max(8, rect.right - 120),
          zIndex: 9998,
        }
      : undefined;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <Button
        variant="ghost"
        size="xs"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={disabled}
        title="Actions"
        aria-label="Menu"
      >
        ⋯
      </Button>
      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="py-0.5 min-w-[120px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Supprimer
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
