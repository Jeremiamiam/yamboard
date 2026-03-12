"use client";

import Image from "next/image";
import { logout } from "@/app/login/actions";
import { useStore } from "@/lib/store";

export function GlobalNav() {
  const toggle = useStore((s) => s.toggleSidebar);
  const currentView = useStore((s) => s.currentView);
  const navigateToCompta = useStore((s) => s.navigateToCompta);
  const navigateHome = useStore((s) => s.navigateHome);

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
        <button
          onClick={navigateHome}
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
        </button>
        <button
          onClick={navigateHome}
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
        </button>

        {/* Spacer */}
        <div className="hidden md:flex flex-1" />

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={navigateToCompta}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
              currentView === "compta"
                ? "text-zinc-900 bg-zinc-200 dark:text-white dark:bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            Comptabilité
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
    </>
  );
}
