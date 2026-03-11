"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentViewer } from "@/components/DocumentViewer";
import type {
  Client,
  Project,
  Document,
  BudgetProduct,
} from "@/lib/types";
import { deleteDocument } from "@/app/(dashboard)/actions/documents";
import { useStore } from "@/lib/store";
import { useClientContacts } from "@/hooks/useClientContacts";
import { useClientLinks } from "@/hooks/useClientLinks";
import {
  ClientHeader,
  ClientDocsSection,
  ClientMissionsSection,
  ContactsBlock,
  LinksBlock,
} from "@/components/client";

type Props = {
  client: Client;
  projects: Project[];
  budgetByProject: Record<string, BudgetProduct[]>;
  globalDocs: Document[];
  clientId: string;
};

export function ClientPageShell({
  client,
  projects,
  budgetByProject,
  globalDocs,
  clientId,
}: Props) {
  const router = useRouter();
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [isPendingDoc, startDocTransition] = useTransition();

  const { contacts, refresh: refreshContacts } = useClientContacts(clientId);
  const { links, refresh: refreshLinks } = useClientLinks(clientId);

  function handleDeleteDoc(docId: string) {
    startDocTransition(async () => {
      const err = await deleteDocument(docId);
      if (!err.error) {
        useStore.getState().loadData();
        if (viewerDoc?.id === docId) setViewerDoc(null);
      }
    });
  }

  return (
    <>
      <DocumentViewer
        doc={viewerDoc}
        onClose={() => setViewerDoc(null)}
        onDelete={
          viewerDoc
            ? (docId) => handleDeleteDoc(docId)
            : undefined
        }
        isPending={isPendingDoc}
      />

      <div
        className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
        style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
      >
        <ClientHeader
          client={client}
          clientId={clientId}
          onArchived={() => router.push("/")}
          onDeleted={() => router.push("/")}
        >
          <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800">
            <ContactsBlock
              clientId={clientId}
              contacts={contacts}
              onRefresh={refreshContacts}
              showAdd={showAddContact}
              onToggleAdd={() => {
                setShowAddContact((v) => !v);
                setShowAddLink(false);
              }}
              clientColor={client.color}
            />
            <LinksBlock
              clientId={clientId}
              links={links}
              onRefresh={refreshLinks}
              showAdd={showAddLink}
              onToggleAdd={() => {
                setShowAddLink((v) => !v);
                setShowAddContact(false);
              }}
              clientColor={client.color}
            />
          </div>

          <ClientDocsSection
            clientId={clientId}
            clientColor={client.color}
            globalDocs={globalDocs}
            onDocClick={setViewerDoc}
            onDeleteDoc={handleDeleteDoc}
            isPendingDoc={isPendingDoc}
          />
        </ClientHeader>

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
