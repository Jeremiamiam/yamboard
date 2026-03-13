import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   SectionHeader — typographic hierarchy.
   ═══════════════════════════════════════════════════════════════ */

const levels = {
  /** Page title — large, bold */
  h1: "text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
  /** Section title */
  h2: "text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none",
  /** Subsection title */
  h3: "text-base font-semibold text-zinc-900 dark:text-white",
  /** Uppercase label — neon tint in dark, monospace feel */
  label:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-emerald-500/60",
  /** Smaller uppercase label */
  sublabel:
    "text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500",
} as const;

type Level = keyof typeof levels;

interface SectionHeaderProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: Level;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

function SectionHeader({ level = "h2", as, className, ...props }: SectionHeaderProps) {
  const Tag = as ?? (level === "label" || level === "sublabel" ? "p" : level === "h1" ? "h1" : level === "h2" ? "h2" : "h3");
  return <Tag className={cn(levels[level], className)} {...props} />;
}

export { SectionHeader, type SectionHeaderProps };
