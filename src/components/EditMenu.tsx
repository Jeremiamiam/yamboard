"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";

/**
 * Bouton "Éditer" au niveau du titre — ouvre un menu Renommer / Supprimer.
 * Cohérent pour client, projet, produit.
 * Rendu en portal pour éviter le clipping (overflow) et les conflits de z-index.
 */
export function EditMenu({
  onRename,
  onDelete,
  confirmDeleteLabel = "Supprimer ?",
  disabled,
  className = "",
  extraItems = [],
  hideDelete = false,
}: {
  onRename: () => void;
  onDelete: () => void;
  confirmDeleteLabel?: string;
  disabled?: boolean;
  className?: string;
  extraItems?: Array<{ label: string; onClick: () => void; destructive?: boolean }>;
  hideDelete?: boolean;
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

  function handleRename() {
    setOpen(false);
    onRename();
  }

  function handleDelete() {
    if (confirm(confirmDeleteLabel)) {
      setOpen(false);
      onDelete();
    }
  }

  const rect = ref.current?.getBoundingClientRect();
  const menuStyle =
    rect && typeof document !== "undefined"
      ? {
          position: "fixed" as const,
          top: rect.bottom + 4,
          left: rect.left,
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
      >
        Éditer
      </Button>
      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="py-0.5 min-w-[140px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRename(); }}
              className="w-full px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Renommer
            </button>
            {extraItems.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  item.destructive ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {item.label}
              </button>
            ))}
            {!hideDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Supprimer
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
