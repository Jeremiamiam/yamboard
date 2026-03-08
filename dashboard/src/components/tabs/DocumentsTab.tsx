"use client";

import { useState, useTransition } from "react";
import { DOC_TYPE_LABEL, DOC_TYPE_COLOR, type Project, type Document } from "@/lib/mock";
import { DocumentViewer } from "@/components/DocumentViewer";
import { createNote } from "@/app/(dashboard)/actions/documents";

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
  const [isPending, startTransition] = useTransition();

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<Document["type"]>("brief");
  const [newDocContent, setNewDocContent] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const allProjectDocs = projectDocs;

  function handleAddDoc() {
    const name = newDocName.trim();
    if (!name) return;
    setAddError(null);
    startTransition(async () => {
      const result = await createNote({
        clientId,
        projectId: project.id,
        name,
        type: newDocType,
        content: newDocContent.trim(),
      });
      if (result.error) {
        setAddError(result.error);
        return;
      }
      setShowAddDoc(false);
      setNewDocName("");
      setNewDocType("brief");
      setNewDocContent("");
    });
  }

  return (
    <>
      <DocumentViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />

      <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Documents</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {allProjectDocs.length + clientDocs.length} document{(allProjectDocs.length + clientDocs.length) !== 1 ? "s" : ""} · {project.name}
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
          <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed space-y-3">
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Nom du document…"
                autoFocus
                className="flex-1 min-w-[160px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as Document["type"])}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              >
                <option value="brief">Brief</option>
                <option value="platform">Plateforme de marque</option>
                <option value="campaign">Campagne</option>
                <option value="site">Site</option>
                <option value="other">Autre</option>
              </select>
              <button
                onClick={handleAddDoc}
                disabled={!newDocName.trim() || isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800 shrink-0"
                style={{ background: newDocName.trim() ? clientColor : undefined }}
              >
                {isPending ? "Enregistrement…" : "Ajouter"}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Note / contenu — colle ou écris le texte du document. Ce contenu sera injecté directement dans le contexte de l'agent."
                rows={6}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-y leading-relaxed"
              />
              {newDocContent.trim() && (
                <span className="absolute bottom-2.5 right-3 text-[11px] text-zinc-400 dark:text-zinc-600 pointer-events-none">
                  {newDocContent.trim().split(/\s+/).filter(Boolean).length} mots
                </span>
              )}
            </div>
            {addError && (
              <p className="text-xs text-red-500">{addError}</p>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
              La note est facultative — un doc sans contenu apparaît quand même dans la liste.
            </p>
          </div>
        )}

        {/* Docs de marque (client) — lecture seule */}
        {clientDocs.length > 0 && (
          <section className="mb-8">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3">
              Documents de marque · lecture seule
            </h3>
            <div className="flex flex-wrap gap-2">
              {clientDocs.map((doc) => (
                <DocChip key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        )}

        {/* Livrables projet */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3">
            Livrables {project.name}
          </h3>
          {allProjectDocs.length === 0 ? (
            <EmptyState projectName={project.name} onAdd={() => setShowAddDoc(true)} />
          ) : (
            <div className="space-y-2">
              {allProjectDocs.map((doc) => (
                <DocRow key={doc.id} doc={doc} onClick={() => setViewerDoc(doc)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function DocChip({ doc }: { doc: Document }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dotted border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 cursor-default">
      <DocIcon type={doc.type} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]">{doc.name}</p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-600">{doc.updatedAt} · {doc.size}</p>
      </div>
    </div>
  );
}

function DocRow({ doc, onClick }: { doc: Document; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
        <DocIcon type={doc.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate">
            {doc.name}
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${DOC_TYPE_COLOR[doc.type]}`}>
            {DOC_TYPE_LABEL[doc.type]}
          </span>
          {doc.content && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0">· note</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-600">Mis à jour le {doc.updatedAt}</span>
          <span className="text-zinc-400 dark:text-zinc-700">·</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-600">{doc.size}</span>
        </div>
      </div>
      <span className="text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors text-sm shrink-0">
        →
      </span>
    </button>
  );
}

function DocIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    brief: "📋",
    platform: "🏗",
    campaign: "📣",
    site: "🌐",
    other: "📄",
  };
  return <span className="text-base">{icons[type] ?? "📄"}</span>;
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
