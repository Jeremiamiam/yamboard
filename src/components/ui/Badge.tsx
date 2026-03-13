import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   Badge — status indicators, pills, tags.
   ═══════════════════════════════════════════════════════════════ */

const base = "inline-flex items-center gap-1 font-semibold shrink-0";

const variants = {
  /** Neutral pill */
  default:
    "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700",
  /** Green / success — neon */
  success:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25",
  /** Yellow / warning */
  warning:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25",
  /** Red / error */
  danger:
    "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25",
  /** Blue / info */
  info:
    "text-blue-600 dark:text-emerald-400 bg-blue-50 dark:bg-emerald-500/10 border border-blue-200 dark:border-emerald-500/25",
  /** Subtle — text only with very light bg */
  subtle:
    "text-zinc-500 dark:text-zinc-500 bg-transparent border-transparent",
} as const;

const sizes = {
  xs: "text-[9px] px-1.5 py-0.5 rounded",
  sm: "text-[10px] px-2 py-0.5 rounded-full",
  md: "text-[11px] px-2.5 py-1 rounded-full",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

function Badge({ variant = "default", size = "sm", dot, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", {
            "bg-zinc-400 dark:bg-zinc-500": variant === "default" || variant === "subtle",
            "bg-emerald-500": variant === "success",
            "bg-amber-500": variant === "warning",
            "bg-red-500": variant === "danger",
            "bg-blue-500": variant === "info",
          })}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, type BadgeProps };
