"use client";

import { useState, useEffect, useTransition } from "react";
import { DocumentViewer } from "@/components/DocumentViewer";
import type {
  Client,
  Project,
  BudgetProduct,
} from "@/lib/types";
import { updateClientAction, archiveClientAction, deleteClientAction, deleteDocumentAction } from "@/lib/store/actions";
import { removeClientLogo } from "@/app/(dashboard)/actions/clients";
import { useStore } from "@/lib/store";
import { ClientMissionsSection, ClientTodosSection } from "@/components/client";
import { ClientBreadcrumbNav } from "@/components/ClientBreadcrumbNav";
import { EditMenu } from "@/components/EditMenu";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Input";
import { invalidateLogoCache } from "@/components/ClientAvatar";
import { toast } from "sonner";

type Props = {
  client: Client;
  projects: Project[];
  budgetByProject: Record<string, BudgetProduct[]>;
  clientId: string;
};

export function ClientPageShell({
  client,
  projects,
  budgetByProject,
  clientId,
}: Props) {
  const navigateTo = useStore((s) => s.navigateTo);
  const viewerDocId = useStore((s) => s.viewerDocId);
  const setViewerDocId = useStore((s) => s.setViewerDocId);
  const documents = useStore((s) => s.documents);
  const viewerDoc = viewerDocId ? documents.find((d) => d.id === viewerDocId) ?? null : null;
  const [isPendingDoc, startDocTransition] = useTransition();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [isPendingClient, startClientTransition] = useTransition();

  useEffect(() => {
    setEditName(client.name);
  }, [client.name]);

  function handleSaveEdit() {
    const name = editName.trim();
    if (!name || name === client.name) {
      setIsEditingName(false);
      return;
    }
    startClientTransition(async () => {
      const result = await updateClientAction(clientId, { name });
      if (!result.error) {
        setIsEditingName(false);
        useStore.getState().loadData();
        toast.success("Client renommé");
      }
    });
  }

  function handleArchive() {
    startClientTransition(async () => {
      await archiveClientAction(clientId);
      useStore.getState().loadData();
    });
  }

  function handleDelete() {
    startClientTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (!result.error) {
        useStore.getState().loadData();
        navigateTo("");
      }
    });
  }

  function handleRemoveLogo() {
    startClientTransition(async () => {
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

  function handleDeleteDoc(docId: string) {
    if (viewerDocId === docId) setViewerDocId(null);
    startDocTransition(async () => {
      await deleteDocumentAction(docId);
    });
  }

  return (
    <>
      <DocumentViewer
        doc={viewerDoc}
        onClose={() => setViewerDocId(null)}
        onDelete={
          viewerDoc
            ? (docId) => handleDeleteDoc(docId)
            : undefined
        }
        isPending={isPendingDoc}
      />

      <div
        className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
        style={{ paddingLeft: "calc(var(--sidebar-w) + var(--client-detail-sidebar-w))", paddingTop: "calc(var(--nav-h) + var(--breadcrumb-h))" }}
      >
        <ClientBreadcrumbNav
          client={client}
          clientId={clientId}
          rightSlot={
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-500">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setEditName(client.name);
                      }
                    }}
                    autoFocus
                    placeholder="Nom du client"
                    className="bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none min-w-[120px]"
                  />
                  <Button variant="ghost" size="xs" onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-500">OK</Button>
                  <Button variant="ghost" size="xs" onClick={() => { setIsEditingName(false); setEditName(client.name); }}>✕</Button>
                </div>
              ) : (
                <EditMenu
                  onRename={() => setIsEditingName(true)}
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
              )}
            </div>
          }
        />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          <ClientTodosSection clientId={clientId} clientColor={client.color} />
          <ClientMissionsSection
            clientId={clientId}
            clientColor={client.color}
            projects={projects}
            budgetByProject={budgetByProject}
          />
        </div>
      </div>
    </>
  );
}
