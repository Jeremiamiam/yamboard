"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const ThemeContext = createContext<{
  preference: ThemePreference;
  resolved: ResolvedTheme;
  theme: ResolvedTheme; /* alias pour compat */
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
} | null>(null);

function resolveTheme(pref: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (pref === "system") return prefersDark ? "dark" : "light";
  return pref;
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-theme", resolved);
  html.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemePreference | null;
    const valid: ThemePreference[] = ["light", "dark", "system"];
    const initial: ThemePreference = stored && valid.includes(stored) ? stored : "system";
    setPreference(initial);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const handler = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved = resolveTheme(preference, prefersDark);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const setTheme = (t: ThemePreference) => {
    setPreference(t);
    if (typeof document !== "undefined") {
      localStorage.setItem("theme", t);
      applyTheme(resolveTheme(t, prefersDark));
    }
  };

  const toggleTheme = () => {
    const next = resolved === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ preference, resolved, theme: resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
