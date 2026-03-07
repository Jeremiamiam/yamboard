"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getClients, type Client, type ClientCategory } from "@/lib/mock";

const TABS: { id: ClientCategory; label: string }[] = [
  { id: "client", label: "Clients" },
  { id: "prospect", label: "Prospects" },
  { id: "archived", label: "Archives" },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const activeId = pathname.split("/")[1];
  const [tab, setTab] = useState<ClientCategory>("client");

  const clients = getClients(tab);

  return (
    <aside
      className="fixed top-12 left-0 bottom-0 z-40 flex flex-col border-r border-zinc-800"
      style={{ width: "var(--sidebar-w)", background: "#0c0c0e" }}
    >
      {/* ── Tab switcher ── */}
      <div className="shrink-0 flex border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
              tab === t.id
                ? "text-zinc-200 border-b border-white -mb-px"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="shrink-0 p-3">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher…"
            className="bg-transparent text-xs text-zinc-400 placeholder-zinc-600 outline-none w-full"
          />
        </div>
      </div>

      {/* ── List ── */}
      <nav className="flex-1 overflow-y-auto px-2">
        {clients.length === 0 ? (
          <p className="text-xs text-zinc-700 px-3 py-4">Aucun élément</p>
        ) : (
          clients.map((client) => (
            <ClientItem key={client.id} client={client} active={client.id === activeId} />
          ))
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 p-3 border-t border-zinc-800">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900 transition-colors text-sm">
          <span className="text-base leading-none">+</span>
          <span>
            {tab === "client" ? "Nouveau client" : tab === "prospect" ? "Nouveau prospect" : "—"}
          </span>
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

  return (
    <Link
      href={`/${client.id}`}
      className={`flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-all ${
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
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{client.industry}</p>
      </div>
    </Link>
  );
}
