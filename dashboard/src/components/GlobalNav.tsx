"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { logout } from "@/app/login/actions";
import { useSidebar } from "@/context/Sidebar";

export function GlobalNav() {
  const pathname = usePathname();
  const { preference, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, []);
  const { toggle } = useSidebar();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-4 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="md:hidden mr-3 w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect y="2" width="16" height="1.5" rx="1" />
            <rect y="7.25" width="16" height="1.5" rx="1" />
            <rect y="12.5" width="16" height="1.5" rx="1" />
          </svg>
        </button>

        {/* Brand — desktop: fixed sidebar width / mobile: flex-1 */}
        <Link
          href="/"
          className="hidden md:flex items-center gap-2 select-none shrink-0 hover:opacity-90 transition-opacity cursor-pointer py-2 px-2"
          style={{ width: "var(--sidebar-w)" }}
          title="Accueil"
        >
          <Image
            src="/yamboard_logo.svg"
            alt="YamBoard"
            width={120}
            height={53}
            className="h-10 w-auto invert dark:invert-0"
          />
        </Link>
        <Link
          href="/"
          className="md:hidden flex items-center gap-2 select-none flex-1 hover:opacity-90 transition-opacity cursor-pointer py-2 px-2"
          title="Accueil"
        >
          <Image
            src="/yamboard_logo.svg"
            alt="YamBoard"
            width={120}
            height={53}
            className="h-10 w-auto invert dark:invert-0"
          />
        </Link>

        {/* Nav items — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <NavLink href="/" label="Clients" active={pathname !== "/compta"} />
          <NavLink href="/compta" label="Comptabilité" active={pathname === "/compta"} />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Thème"
              aria-expanded={open}
            >
              <span className="text-xs">
                {resolved === "dark" ? "☽" : "☀"}
              </span>
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
                {(["light", "dark", "system"] as const).map((p) => (
                  <ThemeOption
                    key={p}
                    value={p}
                    label={p === "system" ? "Système" : p === "dark" ? "Sombre" : "Clair"}
                    icon={p === "system" ? "🖥" : p === "dark" ? "☽" : "☀"}
                    active={preference === p}
                    onClick={() => {
                      setTheme(p);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Déconnexion"
            >
              <span className="text-xs text-zinc-600 dark:text-zinc-400">⏻</span>
            </button>
          </form>
        </div>
      </header>
    </>
  );
}

function ThemeOption({
  value,
  label,
  icon,
  active,
  onClick,
}: {
  value: ThemePreference;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
        active
          ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? "text-zinc-900 bg-zinc-200 dark:text-white dark:bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}
