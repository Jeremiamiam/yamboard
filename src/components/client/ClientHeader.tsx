"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import type { Client } from "@/lib/types";
import {
  updateClientAction,
  archiveClientAction,
  deleteClientAction,
} from "@/lib/store/actions";
import {
  createClientLogoUploadUrl,
  saveClientLogo,
  removeClientLogo,
} from "@/app/(dashboard)/actions/clients";
import { useStore } from "@/lib/store";
import { ClientAvatar, invalidateLogoCache } from "@/components/ClientAvatar";
import { EditMenu } from "@/components/EditMenu";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Props = {
  client: Client;
  clientId: string;
  onArchived: () => void;
  onDeleted: () => void;
  children?: React.ReactNode;
};

export function ClientHeader({ client, clientId, onArchived, onDeleted, children }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [isPendingClient, startClientTransition] = useTransition();
  const [isPendingLogo, startLogoTransition] = useTransition();
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(client.name);
  }, [client.name]);

  function handleSaveEdit() {
    const name = editName.trim();
    if (!name || name === client.name) {
      setIsEditing(false);
      return;
    }
    startClientTransition(async () => {
      const result = await updateClientAction(clientId, { name });
      if (!result.error) setIsEditing(false);
    });
  }

  function handleArchive() {
    startClientTransition(async () => {
      await archiveClientAction(clientId);
      onArchived();
    });
  }

  function handleDelete() {
    startClientTransition(async () => {
      await deleteClientAction(clientId);
      onDeleted();
    });
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
      toast.error("Seuls les fichiers SVG sont acceptés");
      return;
    }
    e.target.value = "";
    startLogoTransition(async () => {
      const urlResult = await createClientLogoUploadUrl(clientId);
      if ("error" in urlResult) {
        toast.error(urlResult.error);
        return;
      }
      const supabase = createBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(urlResult.path, urlResult.token, file, {
          contentType: "image/svg+xml",
        });
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }
      const saveResult = await saveClientLogo(clientId, urlResult.path);
      if (saveResult.error) {
        toast.error(saveResult.error);
        return;
      }
      invalidateLogoCache(urlResult.path);
      invalidateLogoCache(client.logoPath);
      useStore.getState().loadData();
      toast.success("Logo mis à jour");
    });
  }

  function handleRemoveLogo() {
    startLogoTransition(async () => {
      const result = await removeClientLogo(clientId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      invalidateLogoCache(client.logoPath);
      useStore.getState().loadData();
      toast.success("Logo supprimé");
    });
  }

  return (
    <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-visible relative z-20">
      <input
        ref={logoInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={isPendingLogo}
            className="shrink-0 cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
            title={client.logoPath ? "Changer le logo" : "Ajouter un logo"}
          >
            <ClientAvatar client={client} size="md" />
          </button>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") {
                      setIsEditing(false);
                      setEditName(client.name);
                    }
                  }}
                  autoFocus
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-semibold"
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || isPendingClient}
                  className="px-2 py-1 rounded text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40"
                >
                  {isPendingClient ? "…" : "OK"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(client.name);
                  }}
                  className="px-2 py-1 rounded text-sm text-zinc-500 hover:text-zinc-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white leading-none">
                  {client.name}
                </h1>
                <EditMenu
                  onRename={() => setIsEditing(true)}
                  onDelete={handleDelete}
                  confirmDeleteLabel="Supprimer définitivement ce client ?"
                  disabled={isPendingClient}
                  hideDelete={client.category !== "archived"}
                  extraItems={[
                    ...(client.logoPath
                      ? [{ label: "Supprimer le logo", onClick: handleRemoveLogo, destructive: false }]
                      : []),
                    ...(client.category !== "archived"
                      ? [{ label: "Archiver", onClick: handleArchive, destructive: false }]
                      : []),
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {children}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {client.since && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 dark:text-zinc-600">Client depuis</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{client.since}</p>
            </div>
          )}
        </div>
      </div>
      {children}
    </header>
  );
}
