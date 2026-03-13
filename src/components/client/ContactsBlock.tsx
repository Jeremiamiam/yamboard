"use client";

import { useState, useTransition } from "react";
import {
  createContactAction,
  updateContactAction,
  deleteContactAction,
} from "@/lib/store/actions";
import { DeleteMenu } from "@/components/DeleteMenu";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Input";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getContrastTextColor } from "@/lib/color-utils";
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
    <Surface variant="muted" className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span style={{ color: clientColor }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          <SectionHeader level="label" as="span" style={{ color: clientColor }}>
            Contacts
          </SectionHeader>
          <span className="text-xs text-zinc-500 dark:text-zinc-600">({contacts.length})</span>
        </div>
        <Button
          variant={showAdd ? "secondary" : "ghost"}
          size="icon_sm"
          onClick={onToggleAdd}
          style={!showAdd ? { color: clientColor } : undefined}
          title="Ajouter un contact"
        >
          +
        </Button>
      </div>
      <div className="px-4 py-2 min-h-[44px] max-h-[140px] overflow-y-auto">
        {showAdd && (
          <Surface variant="card" padding="sm" className="mb-3 space-y-2">
            <InputField
              inputSize="sm"
              type="text"
              placeholder="Nom / Prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <InputField
              inputSize="sm"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="xs"
                onClick={handleAdd}
                disabled={!name.trim() || isPending}
                style={name.trim() ? { background: clientColor, color: getContrastTextColor(clientColor) } : undefined}
              >
                {isPending ? "…" : "OK"}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onToggleAdd();
                  setName("");
                  setEmail("");
                }}
              >
                Annuler
              </Button>
            </div>
          </Surface>
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
                <InputField
                  inputSize="sm"
                  type="text"
                  defaultValue={c.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.name) handleUpdate(c.id, { name: v });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                />
                <InputField
                  inputSize="sm"
                  type="email"
                  defaultValue={c.email ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (c.email ?? "")) handleUpdate(c.id, { email: v || undefined });
                  }}
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setEditingId(null)}
                >
                  Fermer
                </Button>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{c.name}</p>
                  <p className={`text-xs truncate ${c.email ? "text-zinc-500 dark:text-zinc-600" : "text-amber-500 dark:text-amber-600"}`}>{c.email || "e-mail manquant"}</p>
                </div>
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon_sm"
                    onClick={() => setEditingId(c.id)}
                    title="Modifier"
                  >
                    ✎
                  </Button>
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
    </Surface>
  );
}
