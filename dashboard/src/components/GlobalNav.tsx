"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { logout } from "@/app/login/actions";
import { AgencyChatDrawer } from "@/components/AgencyChatDrawer";
import { useSidebar } from "@/context/Sidebar";

export function GlobalNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();
  const [agencyChatOpen, setAgencyChatOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-4 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
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
        <div
          className="hidden md:flex items-center gap-2 select-none shrink-0"
          style={{ width: "var(--sidebar-w)" }}
        >
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Yam</span>
          <span className="text-sm font-semibold tracking-tight text-zinc-500">board</span>
        </div>
        <div className="md:hidden flex items-center gap-2 select-none flex-1">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Yam</span>
          <span className="text-sm font-semibold tracking-tight text-zinc-500">board</span>
        </div>

        {/* Nav items — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <NavLink href="/" label="Clients" active={pathname !== "/compta"} />
          <NavLink href="/compta" label="Comptabilité" active={pathname === "/compta"} />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            <span className="text-xs">{theme === "dark" ? "☀" : "☽"}</span>
          </button>
          <div className="hidden sm:flex w-7 h-7 rounded-full bg-emerald-600 items-center justify-center">
            <span className="text-xs font-semibold text-white">Y</span>
          </div>
          <button
            onClick={() => setAgencyChatOpen(true)}
            className="px-3 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            title="Chat agence — Brandon"
          >
            Brandon
          </button>
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

      <AgencyChatDrawer
        open={agencyChatOpen}
        onClose={() => setAgencyChatOpen(false)}
      />
    </>
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
