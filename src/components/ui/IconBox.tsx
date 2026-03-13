import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   IconBox — rounded container for icons, emojis, avatars.
   ═══════════════════════════════════════════════════════════════ */

const sizes = {
  xs: "w-6 h-6 text-xs rounded-md",
  sm: "w-7 h-7 text-sm rounded-lg",
  md: "w-9 h-9 text-sm rounded-lg",
  lg: "w-12 h-12 text-base rounded-xl",
  xl: "w-14 h-14 text-2xl rounded-2xl",
} as const;

const variants = {
  /** Standard bordered box — subtle glass */
  default:
    "bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60",
  /** White/dark surface — glass */
  surface:
    "bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/60",
  /** Colored background (use style={{ background }} for dynamic color) */
  tinted: "",
  /** No background — just centers content */
  ghost: "",
} as const;

type Size = keyof typeof sizes;
type Variant = keyof typeof variants;

interface IconBoxProps extends HTMLAttributes<HTMLDivElement> {
  size?: Size;
  variant?: Variant;
}

function IconBox({ size = "md", variant = "default", className, ...props }: IconBoxProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { IconBox, type IconBoxProps };
