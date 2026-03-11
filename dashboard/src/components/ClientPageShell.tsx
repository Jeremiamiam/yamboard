"use client";

import { useTransition } from "react";
import { DocumentViewer } from "@/components/DocumentViewer";
import type {
  Client,
  Project,
  BudgetProduct,
} from "@/lib/types";
import { deleteDocument } from "@/app/(dashboard)/actions/documents";
import { useStore } from "@/lib/store";
import { ClientMissionsSection } from "@/components/client";
import { ClientBreadcrumbNav } from "@/components/ClientBreadcrumbNav";

type Props = {
  client: Client;
  projects: Project[];
  budgetByProject: Record<string, BudgetProduct[]>;
  globalDocs?: unknown[];
  clientId: string;
};

export function ClientPageShell({
  client,
  projects,
  budgetByProject,
  clientId,
}: Props) {
  const viewerDocId = useStore((s) => s.viewerDocId);
  const setViewerDocId = useStore((s) => s.setViewerDocId);
  const documents = useStore((s) => s.documents);
  const viewerDoc = viewerDocId ? documents.find((d) => d.id === viewerDocId) ?? null : null;
  const [isPendingDoc, startDocTransition] = useTransition();

  function handleDeleteDoc(docId: string) {
    startDocTransition(async () => {
      const err = await deleteDocument(docId);
      if (!err.error) {
        useStore.getState().loadData();
        if (viewerDocId === docId) setViewerDocId(null);
      }
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
        <ClientBreadcrumbNav client={client} clientId={clientId} />
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
