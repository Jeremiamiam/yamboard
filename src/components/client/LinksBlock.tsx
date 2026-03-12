"use client";

import { useState, useTransition } from "react";
import {
  createClientLinkAction,
  updateClientLinkAction,
  deleteClientLinkAction,
} from "@/lib/store/actions";
import { DeleteMenu } from "@/components/DeleteMenu";
import type { ClientLinkRow } from "@/lib/data/client-queries";

type Props = {
  clientId: string;
  links: ClientLinkRow[];
  onRefresh: () => void;
  showAdd: boolean;
  onToggleAdd: () => void;
  clientColor: string;
};

export function LinksBlock({
  clientId,
  links,
  onRefresh,
  showAdd,
  onToggleAdd,
  clientColor,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const l = label.trim();
    const u = url.trim();
    if (!l || !u) return;
    startTransition(async () => {
      const err = await createClientLinkAction({ clientId, label: l, url: u });
      if (!err.error) {
        setLabel("");
        setUrl("");
        onToggleAdd();
        onRefresh();
      }
    });
  }

  function handleUpdate(linkId: string, updates: { label?: string; url?: string }) {
    startTransition(async () => {
      const err = await updateClientLinkAction(linkId, updates);
      if (!err.error) {
        setEditingId(null);
        onRefresh();
      }
    });
  }

  function doDelete(linkId: string) {
    startTransition(async () => {
      const err = await deleteClientLinkAction(linkId);
      if (!err.error) onRefresh();
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500" style={{ color: clientColor }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400" style={{ color: clientColor }}>
            Liens
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-600">({links.length})</span>
        </div>
        <button
          onClick={onToggleAdd}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${showAdd ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          style={!showAdd ? { color: clientColor } : undefined}
          title="Ajouter un lien"
        >
          +
        </button>
      </div>
      <div className="px-4 py-2 min-h-[44px] max-h-[140px] overflow-y-auto">
        {showAdd && (
          <div className="mb-3 space-y-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <input
              type="text"
              placeholder="Label (ex. Figma, Dropbox…)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
            <input
              type="url"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!label.trim() || !url.trim() || isPending}
                className="px-2 py-1 text-sm rounded text-white disabled:opacity-50 cursor-pointer"
                style={{ background: label.trim() && url.trim() ? clientColor : undefined }}
              >
                {isPending ? "…" : "OK"}
              </button>
              <button
                onClick={() => {
                  onToggleAdd();
                  setLabel("");
                  setUrl("");
                }}
                className="text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        {links.length === 0 && !showAdd && (
          <p className="text-sm text-zinc-500 dark:text-zinc-600 py-1">Aucun lien</p>
        )}
        {links.map((link) => (
          <div
            key={link.id}
            className="group flex items-center justify-between gap-2 py-1.5 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 rounded px-2 -mx-2"
          >
            {editingId === link.id ? (
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  defaultValue={link.label}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== link.label) handleUpdate(link.id, { label: v });
                  }}
                  className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <input
                  type="url"
                  defaultValue={link.url}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== link.url) handleUpdate(link.id, { url: v });
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
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                  style={{ color: clientColor }}
                >
                  {link.label}
                </a>
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(link.id)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Modifier"
                  >
                    ✎
                  </button>
                  <DeleteMenu
                    onDelete={() => doDelete(link.id)}
                    confirmLabel="Supprimer ce lien ?"
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
