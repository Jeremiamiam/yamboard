"use client";

import { useState, useTransition } from "react";
import type { Project, Document } from "@/lib/types";
import { DocumentViewer } from "@/components/DocumentViewer";
import { AddDocForm } from "@/components/AddDocForm";
import { deleteDocument, pinDocument, unpinDocument } from "@/app/(dashboard)/actions/documents";
import { DeleteMenu } from "@/components/DeleteMenu";
import { useStore } from "@/lib/store";

export function DocumentsTab({
  project,
  clientId,
  clientColor,
  projectDocs,
  clientDocs,
}: {
  project: Project;
  clientId: string;
  clientColor: string;
  projectDocs: Document[];
  clientDocs: Document[];
}) {
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <DocumentViewer
        doc={viewerDoc}
        onClose={() => setViewerDoc(null)}
        onDelete={(docId) => startTransition(async () => {
          const err = await deleteDocument(docId);
          if (!err.error) {
            setViewerDoc(null);
            useStore.getState().loadData();
          }
        })}
        isPending={isPending}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Documents</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {projectDocs.length + clientDocs.length} document{(projectDocs.length + clientDocs.length) !== 1 ? "s" : ""} · {project.name}
            </p>
          </div>
          <button
            onClick={() => setShowAddDoc((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              showAddDoc
                ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {showAddDoc ? "✕ Annuler" : "+ Ajouter un doc"}
          </button>
        </div>

        {/* Add doc form */}
        {showAddDoc && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
            <AddDocForm
              clientId={clientId}
              projectId={project.id}
              clientColor={clientColor}
              onSuccess={() => setShowAddDoc(false)}
            />
          </div>
        )}

        {/* Docs de marque (client) — lecture seule */}
        {clientDocs.length > 0 && (
          <section className="mb-8">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3">
              Documents de marque · contexte chat client
            </h3>
            <div className="flex flex-wrap gap-2">
              {clientDocs.map((doc) => (
                <DocChip
                  key={doc.id}
                  doc={doc}
                  onDelete={() => startTransition(async () => {
                    const err = await deleteDocument(doc.id);
                    if (!err.error) useStore.getState().loadData();
                  })}
                  onUnpin={doc.isPinned && doc.projectId ? () => startTransition(async () => {
                    const err = await unpinDocument(doc.id);
                    if (!err.error) useStore.getState().loadData();
                  }) : undefined}
                  onView={() => setViewerDoc(doc)}
                  isPending={isPending}
                />
              ))}
            </div>
          </section>
        )}

        {/* Livrables projet */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3">
            Livrables {project.name}
          </h3>
          {projectDocs.length === 0 ? (
            <EmptyState projectName={project.name} onAdd={() => setShowAddDoc(true)} />
          ) : (
            <div className="space-y-2">
              {projectDocs.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  projectId={project.id}
                  onClick={() => setViewerDoc(doc)}
                  onDelete={() => startTransition(async () => {
                    const err = await deleteDocument(doc.id);
                    if (!err.error) useStore.getState().loadData();
                  })}
                  onPin={() => startTransition(async () => {
                    const err = await pinDocument(doc.id, project.id);
                    if (!err.error) useStore.getState().loadData();
                  })}
                  onUnpin={() => startTransition(async () => {
                    const err = await unpinDocument(doc.id);
                    if (!err.error) useStore.getState().loadData();
                  })}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function DocChip({
  doc,
  onDelete,
  onUnpin,
  onView,
  isPending,
}: {
  doc: Document;
  onDelete: () => void;
  onUnpin?: () => void;
  onView: () => void;
  isPending: boolean;
}) {
  return (
    <div className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dotted border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
      <button onClick={onView} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
        <DocIcon />
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]">{doc.name}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-600">
            {doc.updatedAt} · <ExtractionStatusLabel doc={doc} />
            {doc.isPinned && <span className="ml-1 text-amber-500" title="Épinglé au contexte client">📌</span>}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onUnpin && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnpin(); }}
            disabled={isPending}
            className="p-1 rounded text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            title="Retirer du contexte client"
          >
            📌
          </button>
        )}
        <DeleteMenu
          onDelete={onDelete}
          confirmLabel="Supprimer ce document ?"
          disabled={isPending}
        />
      </div>
    </div>
  );
}

function DocRow({
  doc,
  projectId,
  onClick,
  onDelete,
  onPin,
  onUnpin,
  isPending,
}: {
  doc: Document;
  projectId: string;
  onClick: () => void;
  onDelete: () => void;
  onPin: () => void;
  onUnpin: () => void;
  isPending: boolean;
}) {
  const isProcessing = doc.extractionStatus === "processing";
  const isFailed = doc.extractionStatus === "failed";

  return (
    <div className="flex items-center gap-2 p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group">
      <button
        onClick={onClick}
        disabled={isProcessing}
        className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0 text-left disabled:opacity-90 disabled:cursor-wait"
      >
        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
          {isProcessing ? (
            <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-400 rounded-full animate-spin" aria-hidden />
          ) : isFailed ? (
            <span className="text-amber-500" title="Échec d'extraction">⚠</span>
          ) : (
            <DocIcon />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate w-full sm:w-auto">
              {doc.name}
            </span>
            {doc.content && !doc.storagePath && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0">· note</span>
            )}
            {doc.isPinned && <span className="text-amber-500" title="Épinglé au contexte client">📌</span>}
            {isProcessing && (
              <span className="text-[10px] text-blue-500 dark:text-blue-400 shrink-0">Extraction en cours…</span>
            )}
            {isFailed && (
              <span className="text-[10px] text-amber-600 dark:text-amber-500 shrink-0">Échec d'extraction</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-600">Mis à jour le {doc.updatedAt}</span>
            <span className="text-zinc-400 dark:text-zinc-700">·</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-600">
              <ExtractionStatusLabel doc={doc} />
            </span>
          </div>
        </div>
        <span className="text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors text-sm shrink-0">
          →
        </span>
      </button>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); doc.isPinned ? onUnpin() : onPin(); }}
          disabled={isPending}
          className={`p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 ${doc.isPinned ? "text-amber-500 dark:text-amber-400" : "text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400"}`}
          title={doc.isPinned ? "Retirer du contexte client" : "Épingler au contexte client (chat)"}
        >
          📌
        </button>
        <DeleteMenu
          onDelete={onDelete}
          confirmLabel="Supprimer ce document ?"
          disabled={isPending}
        />
      </div>
    </div>
  );
}

function ExtractionStatusLabel({ doc }: { doc: Document }) {
  if (doc.extractionStatus === "processing") return <>Extraction…</>;
  if (doc.extractionStatus === "failed") return <>Échec</>;
  return <>{doc.size}</>;
}

function DocIcon() {
  return <span className="text-base">📄</span>;
}

function EmptyState({ projectName, onAdd }: { projectName: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">📂</span>
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucun document pour {projectName}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-4">Génère ton premier livrable ou ajoute une note.</p>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        + Ajouter un document
      </button>
    </div>
  );
}
