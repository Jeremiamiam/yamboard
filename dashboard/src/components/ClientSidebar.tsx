"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLIENTS, getClientStats, type Client } from "@/lib/mock";

export function ClientSidebar() {
  const pathname = usePathname();
  const activeId = pathname.split("/")[1];

  return (
    <aside
      className="fixed top-12 left-0 bottom-0 z-40 flex flex-col border-r border-zinc-800"
      style={{ width: "var(--sidebar-w)", background: "#0c0c0e" }}
    >
      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un client…"
            className="bg-transparent text-xs text-zinc-400 placeholder-zinc-600 outline-none w-full"
          />
        </div>
      </div>

      {/* Label */}
      <div className="px-4 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Clients · {CLIENTS.length}
        </span>
      </div>

      {/* Client list */}
      <nav className="flex-1 overflow-y-auto px-2">
        {CLIENTS.map((client) => (
          <ClientItem key={client.id} client={client} active={client.id === activeId} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900 transition-colors text-sm">
          <span className="text-base leading-none">+</span>
          <span>Nouveau client</span>
        </button>
      </div>
    </aside>
  );
}

function ClientItem({ client, active }: { client: Client; active: boolean }) {
  const initials = client.name
    .split(/[\s.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const stats = getClientStats(client.id);

  return (
    <Link
      href={`/${client.id}`}
      className={`flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-all group ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
      }`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          background: active ? client.color + "30" : "#1c1c1f",
          color: active ? client.color : "#71717a",
          border: active ? `1px solid ${client.color}40` : "1px solid #27272a",
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{client.name}</span>
          {client.status === "draft" && (
            <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5 py-0.5 shrink-0">
              draft
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5 truncate">
          {stats.activeCount > 0
            ? `${stats.activeCount} mission${stats.activeCount > 1 ? "s" : ""} active${stats.activeCount > 1 ? "s" : ""}`
            : stats.projectCount > 0
            ? `${stats.projectCount} projet${stats.projectCount > 1 ? "s" : ""}`
            : client.industry}
        </p>
      </div>
    </Link>
  );
}
