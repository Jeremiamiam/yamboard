import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   Progress — bar indicator with optional label.
   ═══════════════════════════════════════════════════════════════ */

const trackSizes = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
} as const;

type TrackSize = keyof typeof trackSizes;

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: TrackSize;
  /** CSS color for the fill bar (hex, var, etc.) */
  color?: string;
}

function Progress({
  value,
  max = 100,
  size = "sm",
  color,
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn(
        "w-full rounded-full bg-zinc-200 dark:bg-zinc-800/60 overflow-hidden",
        trackSizes[size],
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      {...props}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: color ?? "var(--color-text)",
        }}
      />
    </div>
  );
}

export { Progress, type ProgressProps };
