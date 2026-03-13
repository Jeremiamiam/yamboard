"use client";

import { cn } from "@/lib/cn";
import { useEffect, type HTMLAttributes, type MouseEvent } from "react";

/* ═══════════════════════════════════════════════════════════════
   Dialog — modal overlay with backdrop.
   Drawer — slide-in panel from the right.
   ═══════════════════════════════════════════════════════════════ */

/* ─── Backdrop ───────────────────────────────────────────── */

interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

function Backdrop({ onClose, className, ...props }: BackdropProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50 bg-black/60 dark:bg-black/75 dark:backdrop-blur-sm", className)}
      onClick={onClose}
      {...props}
    />
  );
}

/* ─── Dialog ─────────────────────────────────────────────── */

const dialogSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-[90vw] max-h-[90vh]",
} as const;

type DialogSize = keyof typeof dialogSizes;

interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  size?: DialogSize;
}

function Dialog({ open, onClose, size = "md", className, children, ...props }: DialogProps) {
  if (!open) return null;

  function stopProp(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 shadow-xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(80,250,123,0.04)] overflow-hidden pointer-events-auto",
            dialogSizes[size],
            className,
          )}
          onClick={stopProp}
          {...props}
        >
          {children}
        </div>
      </div>
    </>
  );
}

/* ─── Drawer ─────────────────────────────────────────────── */

const drawerSizes = {
  sm: "w-[360px]",
  md: "w-full sm:w-[480px]",
  lg: "w-[70vw] min-w-[320px]",
} as const;

type DrawerSize = keyof typeof drawerSizes;

interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  size?: DrawerSize;
}

function Drawer({ open, onClose, size = "md", className, children, ...props }: DrawerProps) {
  if (!open) return null;

  return (
    <>
      <Backdrop onClose={onClose} />
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800/80 shadow-2xl dark:shadow-[−25px_0_60px_rgba(0,0,0,0.4),0_0_30px_rgba(80,250,123,0.03)] overflow-hidden",
          drawerSizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export { Dialog, Drawer, Backdrop, type DialogProps, type DrawerProps };
