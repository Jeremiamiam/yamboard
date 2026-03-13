"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

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
  ...rest
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  confirmClassName?: string;
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <span className="flex items-center gap-1">
        <Button
          variant="danger"
          size="xs"
          onClick={(e) => { e.stopPropagation(); setArmed(false); onConfirm(); }}
          className={confirmClassName}
        >
          {confirmLabel}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => { e.stopPropagation(); setArmed(false); }}
        >
          ✕
        </Button>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={(e) => { e.stopPropagation(); setArmed(true); }}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </Button>
  );
}
