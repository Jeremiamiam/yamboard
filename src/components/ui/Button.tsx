import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   Button — all button variants in one primitive.
   ═══════════════════════════════════════════════════════════════ */

const base =
  "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0";

const variants = {
  /** Neon primary — emerald glow */
  primary:
    "bg-zinc-900 dark:bg-emerald-500 dark:text-zinc-950 text-white hover:bg-zinc-800 dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_20px_rgba(80,250,123,0.3)] dark:font-semibold transition-all",
  /** Bordered terminal */
  secondary:
    "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-emerald-500/40 hover:text-zinc-800 dark:hover:text-emerald-400 transition-all",
  /** Dashed */
  dashed:
    "border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-600 hover:border-zinc-400 dark:hover:border-emerald-500/30 hover:text-zinc-700 dark:hover:text-emerald-400 transition-all",
  /** Ghost — neon text on hover */
  ghost:
    "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-emerald-500/5 transition-all",
  /** Destructive */
  danger:
    "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all",
} as const;

const sizes = {
  xs: "text-[11px] px-2 py-1 rounded-md gap-1",
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2 rounded-lg gap-2",
  lg: "text-sm px-5 py-2.5 rounded-xl gap-2",
  /** Square icon button */
  icon_sm: "w-7 h-7 rounded-lg text-sm",
  icon_md: "w-8 h-8 rounded-lg text-sm",
  icon_lg: "w-10 h-10 rounded-xl text-base",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, type ButtonProps };
