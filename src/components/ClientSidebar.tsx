"use client";

import { useState, useTransition } from "react";
import type { Client, ClientCategory } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getClientProjectDots } from "@/lib/budget-utils";
import { createClientAction, addTodoAction, toggleTodoAction, deleteTodoAction } from "@/lib/store/actions";
import { ClientAvatar } from "@/components/ClientAvatar";
import { Button, InputField } from "@/components/ui";

type SidebarTab = ClientCategory | "todos";

const TABS: { id: SidebarTab; label: string }[] = [
  { id: "client", label: "Clients" },
  { id: "todos", label: "Todos" },
  { id: "archived", label: "Archives" },
];

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
  const navigateToCompta = useStore((s) => s.navigateToCompta);
  const open = useStore((s) => s.sidebarOpen);
  const close = useStore((s) => s.closeSidebar);
  const todos = useStore((s) => s.todos);

  const [tab, setTab] = useState<SidebarTab>("client");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newTodo, setNewTodo] = useState("");

  const tabIndex = TABS.findIndex((t) => t.id === tab);

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

  function handleAddTodo() {
    const text = newTodo.trim();
    if (!text) return;
    setNewTodo("");
    addTodoAction(text);
  }

  const q = search.trim().toLowerCase();
  const filteredClients = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  const filteredArchived = q ? archived.filter((c) => c.name.toLowerCase().includes(q)) : archived;

  const pendingTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={close} />
      )}
      <aside
        className={`fixed top-20 left-0 bottom-0 z-40 flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 w-60 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* ── Tab switcher with sliding indicator ── */}
        <div className="shrink-0 relative flex border-b border-zinc-200 dark:border-zinc-800">
          <div
            className="absolute bottom-0 h-px bg-zinc-900 dark:bg-white transition-transform duration-300 ease-in-out"
            style={{ width: `${100 / TABS.length}%`, transform: `translateX(${tabIndex * 100}%)` }}
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); setShowForm(false); }}
              className={`flex-1 py-2.5 text-[11px] font-medium transition-colors duration-200 cursor-pointer ${
                tab === t.id
                  ? "text-zinc-800 dark:text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
              }`}
            >
              {t.label}
              {t.id === "todos" && pendingTodos.length > 0 && (
                <span className="ml-1 text-[10px] text-violet-500 dark:text-violet-400">
                  {pendingTodos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Sliding panels ── */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{ width: `${TABS.length * 100}%`, transform: `translateX(-${tabIndex * (100 / TABS.length)}%)` }}
          >
            {/* Panel 0 — Clients */}
            <div className="flex flex-col h-full overflow-hidden" style={{ width: `${100 / TABS.length}%` }}>
              <div className="shrink-0 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={tab === "client" ? search : ""}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher…"
                      className="bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none w-full"
                    />
                  </div>
                  <Button variant="secondary" size="icon_md" onClick={() => setShowForm(true)} title="Nouveau client">
                    <span className="text-lg leading-none font-light">+</span>
                  </Button>
                </div>
                {showForm && tab === "client" && (
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
              <nav className="flex-1 overflow-y-auto px-2">
                {filteredClients.length === 0
                  ? <p className="text-xs text-zinc-500 dark:text-zinc-700 px-3 py-4">Aucun client</p>
                  : filteredClients.map((c) => (
                    <ClientItem key={c.id} client={c} active={c.id === selectedClientId && currentView !== "compta"} />
                  ))
                }
              </nav>
            </div>

            {/* Panel 1 — Todos */}
            <div className="flex flex-col h-full overflow-hidden" style={{ width: `${100 / TABS.length}%` }}>
              <div className="shrink-0 p-3">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddTodo(); }}
                    placeholder="Nouvelle tâche…"
                    className="flex-1 bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon_sm"
                    onClick={handleAddTodo}
                    disabled={!newTodo.trim()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {pendingTodos.length === 0 && doneTodos.length === 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-700 px-3 py-4">Aucune tâche</p>
                )}
                {pendingTodos.map((t) => <TodoItem key={t.id} id={t.id} text={t.text} done={t.done} />)}
                {doneTodos.length > 0 && pendingTodos.length > 0 && (
                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
                )}
                {doneTodos.map((t) => <TodoItem key={t.id} id={t.id} text={t.text} done={t.done} />)}
              </div>
            </div>

            {/* Panel 2 — Archives */}
            <div className="flex flex-col h-full overflow-hidden" style={{ width: `${100 / TABS.length}%` }}>
              <div className="shrink-0 p-3">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={tab === "archived" ? search : ""}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none w-full"
                  />
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-2">
                {filteredArchived.length === 0
                  ? <p className="text-xs text-zinc-500 dark:text-zinc-700 px-3 py-4">Aucune archive</p>
                  : filteredArchived.map((c) => (
                    <ClientItem key={c.id} client={c} active={c.id === selectedClientId && currentView !== "compta"} />
                  ))
                }
              </nav>
            </div>
          </div>
        </div>

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

function TodoItem({ id, text, done }: { id: string; text: string; done: boolean }) {
  return (
    <div className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${done ? "opacity-50" : ""}`}>
      <button
        onClick={() => toggleTodoAction(id, !done)}
        className={`shrink-0 w-4 h-4 rounded border transition-colors cursor-pointer flex items-center justify-center ${
          done
            ? "bg-violet-500 border-violet-500 dark:bg-violet-600 dark:border-violet-600"
            : "border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500"
        }`}
      >
        {done && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-xs text-zinc-700 dark:text-zinc-300 leading-snug ${done ? "line-through" : ""}`}>
        {text}
      </span>
      <Button
        variant="ghost"
        size="icon_sm"
        onClick={() => deleteTodoAction(id)}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
}

function ClientItem({ client, active }: { client: Client; active: boolean }) {
  const closeSidebar = useStore((s) => s.closeSidebar);
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const navigateTo = useStore((s) => s.navigateTo);
  const dots = getClientProjectDots(projects, budgetProducts, client.id);

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
      {dots.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          {dots.map((status, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              status === "soldé" ? "bg-emerald-500" : status === "commencé" ? "bg-amber-500" : "bg-violet-400"
            }`} />
          ))}
        </div>
      )}
    </div>
  );
}
