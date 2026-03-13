import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   Surface — the universal container primitive.
   Replaces all card / panel / section backgrounds.
   ═══════════════════════════════════════════════════════════════ */

const variants = {
  /** Terminal card — angular, thin border */
  card: "rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
  /** Interactive — neon border on hover */
  interactive:
    "rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-emerald-500/30 dark:hover:shadow-[0_0_15px_rgba(80,250,123,0.06)] transition-all cursor-pointer",
  /** Muted */
  muted:
    "rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800",
  /** Dashed border */
  dashed:
    "rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700",
  /** Alert */
  alert:
    "rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-500/20",
  /** Overlay — terminal panel */
  overlay:
    "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]",
  /** Transparent — just layout, no visual */
  ghost: "",
} as const;

type Variant = keyof typeof variants;

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
} as const;

type Padding = keyof typeof paddings;

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  variant?: Variant;
  padding?: Padding;
  as?: "div" | "section" | "article" | "aside" | "button";
}

function Surface({ variant = "card", padding = "none", as: Tag = "div", className, ...props }: SurfaceProps) {
  return (
    <Tag
      className={cn(variants[variant], paddings[padding], className)}
      {...(props as Record<string, unknown>)}
    />
  );
}

export { Surface, type SurfaceProps, type Variant as SurfaceVariant };
