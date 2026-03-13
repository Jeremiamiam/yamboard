"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";

/**
 * Menu ⋯ avec option "Supprimer" — confirmation inline (2 clics), pas de confirm() natif.
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
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setArmed(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  // Auto-reset armed state after 3s
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  function handleDelete() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setOpen(false);
    setArmed(false);
    queueMicrotask(() => onDelete());
  }

  const rect = ref.current?.getBoundingClientRect();
  const menuStyle =
    rect && typeof document !== "undefined"
      ? {
          position: "fixed" as const,
          top: rect.bottom + 4,
          left: Math.max(8, rect.right - 140),
          zIndex: 9998,
        }
      : undefined;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <Button
        variant="ghost"
        size="xs"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); setArmed(false); }}
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
            className="py-0.5 min-w-[140px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                armed
                  ? "bg-red-600 text-white font-medium"
                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}
            >
              {armed ? confirmLabel : "Supprimer"}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
