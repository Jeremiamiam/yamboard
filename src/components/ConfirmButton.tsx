"use client";

import { useState, useEffect } from "react";

/**
 * Two-step confirm button — click once to arm, click again to confirm.
 * Auto-resets after 3s if not confirmed.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Confirmer ?",
  className,
  confirmClassName,
  disabled,
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  confirmClassName?: string;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setArmed(false); onConfirm(); }}
          className={confirmClassName ?? "text-[11px] text-red-600 dark:text-red-400 font-medium hover:underline px-1"}
        >
          {confirmLabel}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setArmed(false); }}
          className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-1"
        >
          ✕
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setArmed(true); }}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
