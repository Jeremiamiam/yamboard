"use client";

import { useState, useTransition } from "react";
import type { Client, ClientCategory } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getClientProjectDots } from "@/lib/budget-utils";
import { createClientAction } from "@/lib/store/actions";
import { ClientAvatar } from "@/components/ClientAvatar";

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
  const selectedClientId = useStore((s) => s.selectedClientId);
  const currentView = useStore((s) => s.currentView);
  const navigateTo = useStore((s) => s.navigateTo);
  const navigateToCompta = useStore((s) => s.navigateToCompta);
  const open = useStore((s) => s.sidebarOpen);
  const close = useStore((s) => s.closeSidebar);
  const [tab, setTab] = useState<ClientCategory>("client");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setFormError(null);
    startTransition(async () => {
      const result = await createClientAction({ name, category: tab === "prospect" ? "prospect" : "client" });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setShowForm(false);
      setNewName("");
      if (result.clientId) {
        navigateTo(result.clientId);
      }
    });
  }

  const clientsByTab: Record<ClientCategory, Client[]> = {
    client: clients,
    prospect: prospects,
    archived: archived,
  }
  const q = search.trim().toLowerCase()
  const currentClients = q
    ? clientsByTab[tab].filter((c) => c.name.toLowerCase().includes(q))
    : clientsByTab[tab]

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={close}
        />
      )}
    <aside
      className={`fixed top-20 left-0 bottom-0 z-40 flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 w-60 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* ── Tab switcher ── */}
      <div className="shrink-0 flex border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "text-zinc-800 border-b border-zinc-900 -mb-px dark:text-zinc-200 dark:border-white"
                : "text-zinc-500 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Search + New ── */}
      <div className="shrink-0 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none w-full"
            />
          </div>
          {tab !== "archived" && (
            <button
              onClick={() => setShowForm(true)}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={tab === "prospect" ? "Nouveau prospect" : "Nouveau client"}
            >
              <span className="text-lg leading-none font-light">+</span>
            </button>
          )}
        </div>
        {showForm && (
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
        )}
      </div>

      {/* ── List ── */}
      <nav className="flex-1 overflow-y-auto px-2">
        {currentClients.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-700 px-3 py-4">Aucun élément</p>
        ) : (
          currentClients.map((client) => (
            <ClientItem
              key={client.id}
              client={client}
              active={client.id === selectedClientId && currentView !== "compta"}
            />
          ))
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => { navigateToCompta(); close(); }}
          className={`md:hidden mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer ${
            currentView === "compta"
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:text-zinc-400 dark:hover:bg-zinc-900"
          }`}
        >
          <span className="text-base leading-none">💳</span>
          <span>Comptabilité</span>
        </button>
      </div>
    </aside>
    </>
  );
}

function ClientItem({ client, active }: { client: Client; active: boolean }) {
  const closeSidebar = useStore((s) => s.closeSidebar);
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const navigateTo = useStore((s) => s.navigateTo);
  const dots = getClientProjectDots(projects, budgetProducts, client.id);

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-2.5 rounded-lg mb-0.5 transition-all ${
        active
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
          : "text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
      }`}
    >
      <button
        onClick={() => { navigateTo(client.id); closeSidebar(); }}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <ClientAvatar client={client} size="sm" rounded="lg" active={active} />
        <span className="text-sm font-medium truncate">{client.name}</span>
      </button>
      {dots.length > 0 && (
        <div className="flex items-center gap-1 shrink-0" title={dots.map((d) => d).join(", ")}>
          {dots.map((status, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                status === "soldé"
                  ? "bg-emerald-500"
                  : status === "commencé"
                    ? "bg-amber-500"
                    : "bg-violet-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
