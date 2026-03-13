"use client";

import { useRef, useState, useCallback, useEffect, type KeyboardEvent, type FocusEvent } from "react";
import { cn } from "@/lib/cn";

/* ═══════════════════════════════════════════════════════════════
   DateInput — segmented day / month / year input.
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

  function handleBlur(e: FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    if (dirty || parts.day !== String(todayParts().day)) {
      commit();
    }
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
    if (e.key === "Tab" && !e.shiftKey) {
      if (segment === "day") {
        e.preventDefault();
        monthRef.current?.focus();
        monthRef.current?.select();
      } else if (segment === "month") {
        e.preventDefault();
        yearRef.current?.focus();
        yearRef.current?.select();
      }
      // year: natural tab out → blur → commit
    }
    if (e.key === "Tab" && e.shiftKey) {
      if (segment === "year") {
        e.preventDefault();
        monthRef.current?.focus();
        monthRef.current?.select();
      } else if (segment === "month") {
        e.preventDefault();
        dayRef.current?.focus();
        dayRef.current?.select();
      }
    }
    // Auto-advance on 2 digits
    if (segment === "day" && /^\d$/.test(e.key)) {
      const next = parts.day + e.key;
      if (next.length >= 2) {
        requestAnimationFrame(() => {
          monthRef.current?.focus();
          monthRef.current?.select();
        });
      }
    }
    if (segment === "month" && /^\d$/.test(e.key)) {
      const next = parts.month + e.key;
      if (next.length >= 2) {
        requestAnimationFrame(() => {
          yearRef.current?.focus();
          yearRef.current?.select();
        });
      }
    }
  }

  function updatePart(segment: "day" | "month" | "year", val: string) {
    const clean = val.replace(/\D/g, "");
    const maxLen = segment === "year" ? 4 : 2;
    setParts((p) => ({ ...p, [segment]: clean.slice(0, maxLen) }));
  }

  const segmentCls = "bg-transparent outline-none text-center text-sm tabular-nums";
  const hasValue = dirty || !!value;

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      className={cn(
        "flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 gap-0.5 transition-colors focus-within:border-zinc-400 dark:focus-within:border-zinc-500",
        className,
      )}
    >
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        value={parts.day}
        onChange={(e) => updatePart("day", e.target.value)}
        onKeyDown={(e) => handleSegmentKey(e, "day")}
        onFocus={(e) => e.target.select()}
        placeholder="JJ"
        className={cn(segmentCls, "w-6", hasValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600")}
        disabled={disabled}
      />
      <span className="text-zinc-400 dark:text-zinc-600 text-sm">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        value={parts.month}
        onChange={(e) => updatePart("month", e.target.value)}
        onKeyDown={(e) => handleSegmentKey(e, "month")}
        onFocus={(e) => e.target.select()}
        placeholder="MM"
        className={cn(segmentCls, "w-6", hasValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600")}
        disabled={disabled}
      />
      <span className="text-zinc-400 dark:text-zinc-600 text-sm">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        value={parts.year}
        onChange={(e) => updatePart("year", e.target.value)}
        onKeyDown={(e) => handleSegmentKey(e, "year")}
        onFocus={(e) => e.target.select()}
        placeholder="AAAA"
        className={cn(segmentCls, "w-10", hasValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600")}
        disabled={disabled}
      />
    </div>
  );
}
