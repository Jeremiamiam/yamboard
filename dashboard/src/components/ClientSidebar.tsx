"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Client, ClientCategory } from "@/lib/types";
import { createClient } from "@/app/(dashboard)/actions/clients";

const TABS: { id: ClientCategory; label: string }[] = [
  { id: "client", label: "Clients" },
  { id: "prospect", label: "Prospects" },
  { id: "archived", label: "Archives" },
];

export function ClientSidebar({
  clients,
  prospects,
  archived,
}: {
  clients: Client[]
  prospects: Client[]
  archived: Client[]
}) {
  const pathname = usePathname();
  const activeId = pathname?.split("/")[1];
  const [tab, setTab] = useState<ClientCategory>("client");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setFormError(null);
    startTransition(async () => {
      const result = await createClient({ name, category: tab === "prospect" ? "prospect" : "client" });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setShowForm(false);
      setNewName("");
    });
  }

  const clientsByTab: Record<ClientCategory, Client[]> = {
    client: clients,
    prospect: prospects,
    archived: archived,
  }
  const currentClients = clientsByTab[tab]

  return (
    <aside
      className="fixed top-12 left-0 bottom-0 z-40 flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* ── Tab switcher ── */}
      <div className="shrink-0 flex border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
              tab === t.id
                ? "text-zinc-800 border-b border-zinc-900 -mb-px dark:text-zinc-200 dark:border-white"
                : "text-zinc-500 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="shrink-0 p-3">
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher…"
            className="bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none w-full"
          />
        </div>
      </div>

      {/* ── List ── */}
      <nav className="flex-1 overflow-y-auto px-2">
        {currentClients.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-700 px-3 py-4">Aucun élément</p>
        ) : (
          currentClients.map((client) => (
            <ClientItem key={client.id} client={client} active={client.id === activeId} />
          ))
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800">
        {showForm ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setShowForm(false); setNewName(""); setFormError(null); }
              }}
              placeholder={tab === "prospect" ? "Nom du prospect…" : "Nom du client…"}
              autoFocus
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
            {formError && <p className="text-[11px] text-red-500">{formError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isPending}
                className="flex-1 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "…" : "Créer"}
              </button>
              <button
                onClick={() => { setShowForm(false); setNewName(""); setFormError(null); }}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          tab !== "archived" && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:text-zinc-400 dark:hover:bg-zinc-900 transition-colors text-sm"
            >
              <span className="text-base leading-none">+</span>
              <span>{tab === "prospect" ? "Nouveau prospect" : "Nouveau client"}</span>
            </button>
          )
        )}
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
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
          : "text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border ${
          active ? "" : "bg-zinc-200 text-zinc-500 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-700"
        }`}
        style={active ? {
          background: client.color + "30",
          color: client.color,
          borderColor: client.color + "40",
        } : undefined}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{client.name}</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-0.5 truncate">{client.industry}</p>
      </div>
    </Link>
  );
}
