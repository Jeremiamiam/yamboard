"use client";

import { useState, useTransition } from "react";
import {
  createContactAction,
  updateContactAction,
  deleteContactAction,
} from "@/lib/store/actions";
import { DeleteMenu } from "@/components/DeleteMenu";
import { useStore } from "@/lib/store";
import type { ContactRow } from "@/lib/data/client-queries";

type Props = {
  clientId: string;
  contacts: ContactRow[];
  onRefresh: () => void;
  showAdd: boolean;
  onToggleAdd: () => void;
  clientColor: string;
};

export function ContactsBlock({
  clientId,
  contacts,
  onRefresh,
  showAdd,
  onToggleAdd,
  clientColor,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const n = name.trim();
    if (!n) return;
    startTransition(async () => {
      const err = await createContactAction({
        clientId,
        name: n,
        email: email.trim() || undefined,
        isPrimary: contacts.length === 0,
      });
      if (!err.error) {
        setName("");
        setEmail("");
        onToggleAdd();
        onRefresh();
        useStore.getState().loadData();
      }
    });
  }

  function handleUpdate(contactId: string, updates: { name?: string; email?: string }) {
    startTransition(async () => {
      const err = await updateContactAction(contactId, updates);
      if (!err.error) {
        setEditingId(null);
        onRefresh();
        useStore.getState().loadData();
      }
    });
  }

  function doDelete(contactId: string) {
    startTransition(async () => {
      const err = await deleteContactAction(contactId);
      if (!err.error) {
        onRefresh();
        useStore.getState().loadData();
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-500" style={{ color: clientColor }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400" style={{ color: clientColor }}>
            Contacts
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-600">({contacts.length})</span>
        </div>
        <button
          onClick={onToggleAdd}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${showAdd ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          style={!showAdd ? { color: clientColor } : undefined}
          title="Ajouter un contact"
        >
          +
        </button>
      </div>
      <div className="px-4 py-2 min-h-[44px] max-h-[140px] overflow-y-auto">
        {showAdd && (
          <div className="mb-3 space-y-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <input
              type="text"
              placeholder="Nom / Prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!name.trim() || isPending}
                className="px-2 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                style={{ background: name.trim() ? clientColor : undefined }}
              >
                {isPending ? "…" : "OK"}
              </button>
              <button
                onClick={() => {
                  onToggleAdd();
                  setName("");
                  setEmail("");
                }}
                className="text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        {contacts.length === 0 && !showAdd && (
          <p className="text-sm text-zinc-500 dark:text-zinc-600 py-1">Aucun contact</p>
        )}
        {contacts.map((c) => (
          <div
            key={c.id}
            className="group flex items-center justify-between gap-2 py-1.5 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 rounded px-2 -mx-2"
          >
            {editingId === c.id ? (
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  defaultValue={c.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.name) handleUpdate(c.id, { name: v });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <input
                  type="email"
                  defaultValue={c.email ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (c.email ?? "")) handleUpdate(c.id, { email: v || undefined });
                  }}
                  className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{c.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-600 truncate">{c.role || c.email || "—"}</p>
                </div>
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Modifier"
                  >
                    ✎
                  </button>
                  <DeleteMenu
                    onDelete={() => doDelete(c.id)}
                    confirmLabel="Supprimer ce contact ?"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
