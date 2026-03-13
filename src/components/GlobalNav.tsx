"use client";

import Image from "next/image";
import { logout } from "@/app/login/actions";
import { useStore } from "@/lib/store";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function GlobalNav({ userName }: { userName?: string }) {
  const toggle = useStore((s) => s.toggleSidebar);
  const currentView = useStore((s) => s.currentView);
  const navigateToCompta = useStore((s) => s.navigateToCompta);
  const navigateHome = useStore((s) => s.navigateHome);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-4 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon_sm"
          onClick={toggle}
          className="md:hidden mr-3"
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect y="2" width="16" height="1.5" rx="1" />
            <rect y="7.25" width="16" height="1.5" rx="1" />
            <rect y="12.5" width="16" height="1.5" rx="1" />
          </svg>
        </Button>

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
          {userName && (
            <span className="hidden sm:block text-sm font-medium text-zinc-600 dark:text-zinc-400 px-2">
              {userName}
            </span>
          )}
          <NotificationBell />
          <Button
            variant={currentView === "compta" ? "secondary" : "ghost"}
            size="sm"
            onClick={navigateToCompta}
            className={cn(
              currentView === "compta" && "text-zinc-900 bg-zinc-200 dark:text-white dark:bg-zinc-800"
            )}
          >
            Comptabilité
          </Button>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="icon_sm"
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title="Déconnexion"
            >
              <span className="text-xs text-zinc-600 dark:text-zinc-400">⏻</span>
            </Button>
          </form>
        </div>
      </header>
    </>
  );
}
