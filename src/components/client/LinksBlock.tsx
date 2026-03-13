"use client";

import { useState, useTransition } from "react";
import {
  createClientLinkAction,
  updateClientLinkAction,
  deleteClientLinkAction,
} from "@/lib/store/actions";
import { DeleteMenu } from "@/components/DeleteMenu";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Input";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getContrastTextColor } from "@/lib/color-utils";
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
    <Surface variant="muted" className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span style={{ color: clientColor }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <SectionHeader level="label" as="span" style={{ color: clientColor }}>
            Liens
          </SectionHeader>
          <span className="text-xs text-zinc-500 dark:text-zinc-600">({links.length})</span>
        </div>
        <Button
          variant={showAdd ? "secondary" : "ghost"}
          size="icon_sm"
          onClick={onToggleAdd}
          style={!showAdd ? { color: clientColor } : undefined}
          title="Ajouter un lien"
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
              placeholder="Label (ex. Figma, Dropbox…)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <InputField
              inputSize="sm"
              type="url"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="xs"
                onClick={handleAdd}
                disabled={!label.trim() || !url.trim() || isPending}
                style={label.trim() && url.trim() ? { background: clientColor, color: getContrastTextColor(clientColor) } : undefined}
              >
                {isPending ? "…" : "OK"}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onToggleAdd();
                  setLabel("");
                  setUrl("");
                }}
              >
                Annuler
              </Button>
            </div>
          </Surface>
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
                <InputField
                  inputSize="sm"
                  type="text"
                  defaultValue={link.label}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== link.label) handleUpdate(link.id, { label: v });
                  }}
                />
                <InputField
                  inputSize="sm"
                  type="url"
                  defaultValue={link.url}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== link.url) handleUpdate(link.id, { url: v });
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
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate text-sm font-medium hover:opacity-80"
                  style={{ color: clientColor }}
                >
                  {link.label}
                </a>
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon_sm"
                    onClick={() => setEditingId(link.id)}
                    title="Modifier"
                  >
                    ✎
                  </Button>
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
    </Surface>
  );
}
