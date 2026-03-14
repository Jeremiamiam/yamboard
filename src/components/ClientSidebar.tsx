"use client";

import { useState, useTransition } from "react";
import type { Client } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getClientProjectDots } from "@/lib/budget-utils";
import { createClientAction } from "@/lib/store/actions";
import { ClientAvatar } from "@/components/ClientAvatar";
import { Button, InputField } from "@/components/ui";

export function ClientSidebar({
  clients,
  archived,
}: {
  clients: Client[]
  archived: Client[]
}) {
  const selectedClientId = useStore((s) => s.selectedClientId);
  const currentView = useStore((s) => s.currentView);
  const navigateTo = useStore((s) => s.navigateTo);
  const open = useStore((s) => s.sidebarOpen);
  const close = useStore((s) => s.closeSidebar);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showArchives, setShowArchives] = useState(false);

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setFormError(null);
    startTransition(async () => {
      const result = await createClientAction({ name, category: "client" });
      if (result.error) { setFormError(result.error); return; }
      setShowForm(false);
      setNewName("");
      if (result.clientId) navigateTo(result.clientId);
    });
  }

  const q = search.trim().toLowerCase();
  const filteredClients = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  const filteredArchived = q ? archived.filter((c) => c.name.toLowerCase().includes(q)) : archived;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={close} />
      )}
      <aside
        className={`fixed top-20 left-0 bottom-0 z-40 flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 w-60 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* ── Search + Create ── */}
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
            <Button variant="secondary" size="icon_md" onClick={() => setShowForm(true)} title="Nouveau client">
              <span className="text-lg leading-none font-light">+</span>
            </Button>
          </div>
          {showForm && (
            <div className="space-y-2">
              <InputField
                inputSize="sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setShowForm(false); setNewName(""); setFormError(null); }
                }}
                placeholder="Nom du client…"
                autoFocus
              />
              {formError && <p className="text-[11px] text-red-500">{formError}</p>}
              <div className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" onClick={handleCreate} disabled={!newName.trim() || isPending}>
                  {isPending ? "…" : "Créer"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setNewName(""); setFormError(null); }}>✕</Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Client list ── */}
        <nav className="flex-1 overflow-y-auto px-2">
          {filteredClients.length === 0 && filteredArchived.length === 0
            ? <p className="text-xs text-zinc-500 dark:text-zinc-700 px-3 py-4">Aucun client</p>
            : filteredClients.map((c) => (
              <ClientItem key={c.id} client={c} active={c.id === selectedClientId && currentView !== "compta"} />
            ))
          }

          {/* ── Archives section ── */}
          {filteredArchived.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setShowArchives(!showArchives)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-500 transition-colors cursor-pointer"
              >
                <span>Archives ({filteredArchived.length})</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${showArchives ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showArchives && (
                <div className="mt-1">
                  {filteredArchived.map((c) => (
                    <ClientItem key={c.id} client={c} active={c.id === selectedClientId && currentView !== "compta"} />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

function ClientItem({ client, active }: { client: Client; active: boolean }) {
  const closeSidebar = useStore((s) => s.closeSidebar);
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const todos = useStore((s) => s.todos);
  const navigateTo = useStore((s) => s.navigateTo);
  const dots = getClientProjectDots(projects, budgetProducts, client.id);
  const pendingTodoCount = todos.filter((t) => !t.done && t.clientId === client.id).length;

  return (
    <div className={`group flex items-center gap-2 px-2 py-2.5 rounded-lg mb-0.5 transition-all ${
      active
        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
        : "text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
    }`}>
      <button
        onClick={() => { navigateTo(client.id); closeSidebar(); }}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <ClientAvatar client={client} size="sm" rounded="lg" active={active} />
        <span className="text-sm font-medium truncate">{client.name}</span>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        {dots.length > 0 && (
          <div className="flex items-center gap-1">
            {dots.map((status, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                status === "soldé" ? "bg-emerald-500" : status === "commencé" ? "bg-amber-500" : "bg-violet-400"
              }`} />
            ))}
          </div>
        )}
        {pendingTodoCount > 0 && (
          <span
            className="flex items-center justify-center text-[10px] font-bold text-white bg-violet-500 min-w-[18px] min-h-[18px] px-1.5 aspect-square rounded-full shadow-sm ring-2 ring-zinc-50 dark:ring-zinc-950"
            title={`${pendingTodoCount} tâche${pendingTodoCount > 1 ? "s" : ""} en attente`}
          >
            {pendingTodoCount}
          </span>
        )}
      </div>
    </div>
  );
}
