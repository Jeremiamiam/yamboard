"use client";

import { useRef, useState, useCallback, useEffect, type KeyboardEvent, type FocusEvent } from "react";
import { cn } from "@/lib/cn";

/* ═══════════════════════════════════════════════════════════════
   DateInput — segmented day / month / year input (FR: JJ/MM/AAAA).
   Always visible segments (no display/edit toggle).
   Tab from amount input lands directly on day segment.
   ═══════════════════════════════════════════════════════════════ */

const MONTHS_FR: Record<string, number> = {
  jan: 1, janv: 1, janvier: 1,
  fev: 2, fév: 2, fevr: 2, févr: 2, fevrier: 2, février: 2,
  mar: 3, mars: 3,
  avr: 4, avril: 4,
  mai: 5,
  jun: 6, juin: 6,
  jul: 7, juil: 7, juillet: 7,
  aou: 8, aoû: 8, aout: 8, août: 8,
  sep: 9, sept: 9, septembre: 9,
  oct: 10, octobre: 10,
  nov: 11, novembre: 11,
  dec: 12, déc: 12, decembre: 12, décembre: 12,
};

type DateParts = { day: string; month: string; year: string };

function parseDateString(raw: string): DateParts | null {
  if (!raw) return null;
  const s = raw.trim();

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return { day: iso[3], month: iso[2], year: iso[1] };

  const frNum = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (frNum) {
    const yr = frNum[3].length === 2 ? `20${frNum[3]}` : frNum[3];
    return { day: frNum[1], month: frNum[2], year: yr };
  }

  const frText = s.match(/^(\d{1,2})\s+([a-zéûôà]+)\.?\s*(\d{2,4})?$/i);
  if (frText) {
    const monthKey = frText[2].toLowerCase().replace(/\.$/, "");
    const m = MONTHS_FR[monthKey];
    if (m) {
      const yr = frText[3]
        ? frText[3].length === 2 ? `20${frText[3]}` : frText[3]
        : String(new Date().getFullYear());
      return { day: frText[1], month: String(m), year: yr };
    }
  }

  return null;
}

function toIso(parts: DateParts): string {
  const d = parts.day.padStart(2, "0");
  const m = parts.month.padStart(2, "0");
  const y = parts.year.padStart(4, "20");
  return `${y}-${m}-${d}`;
}

function pad2(v: string): string {
  const n = parseInt(v, 10);
  if (isNaN(n) || n === 0) return v;
  return String(n).padStart(2, "0");
}

function todayParts(): DateParts {
  const now = new Date();
  return {
    day: String(now.getDate()),
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  };
}

interface DateInputProps {
  value?: string;
  onChange: (isoDate: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function DateInput({ value, onChange, disabled, className }: DateInputProps) {
  const initial = value ? parseDateString(value) ?? todayParts() : todayParts();
  const [parts, setParts] = useState<DateParts>(initial);
  const [dirty, setDirty] = useState(!!value);
  const [focused, setFocused] = useState<"day" | "month" | "year" | null>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync from outside changes
  useEffect(() => {
    if (value) {
      const p = parseDateString(value);
      if (p) setParts(p);
      setDirty(true);
    }
  }, [value]);

  const commit = useCallback(() => {
    const d = parseInt(parts.day, 10);
    const m = parseInt(parts.month, 10);
    if (d > 0 && d <= 31 && m > 0 && m <= 12 && parts.year.length === 4) {
      onChange(toIso(parts));
      setDirty(true);
    }
  }, [parts, onChange]);

  function handleContainerBlur(e: FocusEvent) {
    // If focus stays within the container, don't commit
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setFocused(null);
    if (dirty || parts.day !== String(todayParts().day)) {
      commit();
    }
  }

  function handleSegmentFocus(segment: "day" | "month" | "year") {
    return (e: FocusEvent<HTMLInputElement>) => {
      setFocused(segment);
      e.target.select();
    };
  }

  function handleSegmentKey(
    e: KeyboardEvent<HTMLInputElement>,
    segment: "day" | "month" | "year"
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      (e.target as HTMLInputElement).blur();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      return;
    }

    // Tab navigation between segments
    if (e.key === "Tab" && !e.shiftKey) {
      if (segment === "day") {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (segment === "month") {
        e.preventDefault();
        yearRef.current?.focus();
      }
      // year → natural tab out (blur fires → commit)
    }
    if (e.key === "Tab" && e.shiftKey) {
      if (segment === "year") {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (segment === "month") {
        e.preventDefault();
        dayRef.current?.focus();
      }
      // day + shift → natural tab out
    }

    // Arrow up/down to increment/decrement
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? 1 : -1;
      setParts((p) => {
        if (segment === "day") {
          let d = (parseInt(p.day, 10) || 0) + delta;
          if (d < 1) d = 31; if (d > 31) d = 1;
          return { ...p, day: String(d) };
        }
        if (segment === "month") {
          let m = (parseInt(p.month, 10) || 0) + delta;
          if (m < 1) m = 12; if (m > 12) m = 1;
          return { ...p, month: String(m) };
        }
        let y = (parseInt(p.year, 10) || 2026) + delta;
        return { ...p, year: String(y) };
      });
      return;
    }

    // Auto-advance on digit entry
    if (/^\d$/.test(e.key)) {
      const input = e.target as HTMLInputElement;
      const selAll = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      // Compute what the value will be after this keystroke
      const currentVal = selAll ? "" : input.value;
      const nextVal = currentVal + e.key;

      if (segment === "day") {
        const n = parseInt(nextVal, 10);
        // Advance if: 2 digits typed, OR single digit >= 4 (can't be valid day start)
        if (nextVal.length >= 2 || n >= 4) {
          requestAnimationFrame(() => { monthRef.current?.focus(); });
        }
      }
      if (segment === "month") {
        const n = parseInt(nextVal, 10);
        // Advance if: 2 digits typed, OR single digit >= 2 (can't be valid month start beyond 1x)
        if (nextVal.length >= 2 || n >= 2) {
          requestAnimationFrame(() => { yearRef.current?.focus(); });
        }
      }
    }
  }

  function updatePart(segment: "day" | "month" | "year", val: string) {
    const clean = val.replace(/\D/g, "");
    const maxLen = segment === "year" ? 4 : 2;
    setParts((p) => ({ ...p, [segment]: clean.slice(0, maxLen) }));
  }

  // Display: pad day/month when not focused on that segment
  const displayDay = focused === "day" ? parts.day : pad2(parts.day);
  const displayMonth = focused === "month" ? parts.month : pad2(parts.month);
  const displayYear = parts.year;

  const segmentCls = "bg-transparent outline-none text-center text-sm tabular-nums";
  const hasValue = dirty || !!value;
  const colorCls = hasValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600";

  return (
    <div
      ref={containerRef}
      onBlur={handleContainerBlur}
      className={cn(
        "flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 gap-0.5 transition-colors focus-within:border-zinc-400 dark:focus-within:border-zinc-500",
        className,
      )}
    >
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        value={displayDay}
        onChange={(e) => updatePart("day", e.target.value)}
        onKeyDown={(e) => handleSegmentKey(e, "day")}
        onFocus={handleSegmentFocus("day")}
        placeholder="JJ"
        className={cn(segmentCls, "w-6", colorCls)}
        disabled={disabled}
      />
      <span className="text-zinc-400 dark:text-zinc-600 text-sm">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        value={displayMonth}
        onChange={(e) => updatePart("month", e.target.value)}
        onKeyDown={(e) => handleSegmentKey(e, "month")}
        onFocus={handleSegmentFocus("month")}
        placeholder="MM"
        className={cn(segmentCls, "w-6", colorCls)}
        disabled={disabled}
      />
      <span className="text-zinc-400 dark:text-zinc-600 text-sm">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        value={displayYear}
        onChange={(e) => updatePart("year", e.target.value)}
        onKeyDown={(e) => handleSegmentKey(e, "year")}
        onFocus={handleSegmentFocus("year")}
        placeholder="AAAA"
        className={cn(segmentCls, "w-10", colorCls)}
        disabled={disabled}
      />
    </div>
  );
}
