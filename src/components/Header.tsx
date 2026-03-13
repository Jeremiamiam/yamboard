import Link from "next/link";
import { SectionHeader } from "@/components/ui";

type HeaderProps =
  | { type: "dashboard"; count: number }
  | { type: "wiki"; clientName: string };

export function Header(props: HeaderProps) {
  return (
    <header className="border-b border-[var(--border)] px-4 py-4 sm:px-6 sm:py-5 shrink-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {props.type === "dashboard" ? (
          <>
            <SectionHeader level="h1" as="h1" className="text-lg sm:text-xl">
              getBrandon
            </SectionHeader>
            <span className="text-xs sm:text-sm text-zinc-500 font-mono shrink-0">
              {props.count} client{props.count !== 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <nav className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            >
              ← Dashboard
            </Link>
            <span className="text-zinc-700 shrink-0">/</span>
            <SectionHeader level="h1" as="h1" className="text-base sm:text-xl truncate">
              {props.clientName}
            </SectionHeader>
          </nav>
        )}
      </div>
    </header>
  );
}
