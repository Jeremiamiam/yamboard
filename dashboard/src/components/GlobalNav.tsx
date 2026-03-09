"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { logout } from "@/app/login/actions";
import { AgencyChatDrawer } from "@/components/AgencyChatDrawer";

export function GlobalNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [agencyChatOpen, setAgencyChatOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-4 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Brand */}
        <div className="flex items-center gap-2 select-none" style={{ width: "var(--sidebar-w)" }}>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Yam</span>
          <span className="text-sm font-semibold tracking-tight text-zinc-500">board</span>
        </div>

        {/* Nav items */}
        <nav className="flex items-center gap-1 flex-1">
          <NavLink href="/" label="Clients" active={pathname !== "/compta"} />
          <NavLink href="/compta" label="Comptabilité" active={pathname === "/compta"} />
          <NavItem label="Projets" />
          <NavItem label="Analytics" />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            <span className="text-xs">{theme === "dark" ? "☀" : "☽"}</span>
          </button>
          <button className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">⚙</span>
          </button>
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
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

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? "text-zinc-900 bg-zinc-200 dark:text-white dark:bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </button>
  );
}
