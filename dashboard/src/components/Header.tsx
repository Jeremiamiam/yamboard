import Link from "next/link";

type HeaderProps =
  | { type: "dashboard"; count: number }
  | { type: "wiki"; clientName: string };

export function Header(props: HeaderProps) {
  return (
    <header className="border-b border-[var(--border)] px-6 py-5 shrink-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {props.type === "dashboard" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">getBrandon</h1>
            <span className="text-sm text-zinc-500 font-mono">
              {props.count} client{props.count !== 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Dashboard
            </Link>
            <span className="text-zinc-700">/</span>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {props.clientName}
            </h1>
          </nav>
        )}
      </div>
    </header>
  );
}
