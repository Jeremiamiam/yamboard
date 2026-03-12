"use client";

import { useEffect, useState } from "react";
import type { Document } from "@/lib/types";
import { getDocumentSignedUrl, getDocument } from "@/app/(dashboard)/actions/documents";
import { DeleteMenu } from "@/components/DeleteMenu";
import { toast } from "sonner";

// ─── Component ───────────────────────────────────────────────
export function DocumentViewer({
  doc,
  onClose,
  onDelete,
  isPending,
}: {
  doc: Document | null;
  onClose: () => void;
  onDelete?: (docId: string) => void;
  isPending?: boolean;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fetchedContent, setFetchedContent] = useState<string | null | "loading">(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setPdfUrl(null);
    setFetchedContent(null);

    if (doc?.storagePath) {
      getDocumentSignedUrl(doc.storagePath).then((result) => {
        if ("signedUrl" in result) {
          setPdfUrl(result.signedUrl);
        }
      });
    } else if (doc && !doc.content?.trim()) {
      setFetchedContent("loading");
      getDocument(doc.id).then((result) => {
        if ("doc" in result && result.doc.content) {
          setFetchedContent(result.doc.content);
        } else {
          setFetchedContent("");
        }
      });
    } else if (doc?.content?.trim()) {
      setFetchedContent(doc.content);
    }
  }, [doc?.id, doc?.storagePath, doc?.content]);

  if (!doc) return null;

  const noteContent = doc.content?.trim() || (fetchedContent && fetchedContent !== "loading" ? fetchedContent : null);
  const hasNote = !!noteContent?.trim();
  const isLoadingNote = !doc.storagePath && fetchedContent === "loading";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 bottom-0 z-50 w-[70vw] min-w-[320px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{doc.name}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5">
              Mis à jour le {doc.updatedAt} · {doc.size}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {onDelete && (
              <DeleteMenu
                onDelete={() => onDelete(doc.id)}
                confirmLabel="Supprimer ce document ?"
                disabled={isPending}
                className="px-3 py-1.5"
              />
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[600px]"
              title={doc.name}
            />
          ) : isLoadingNote ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-400 rounded-full animate-spin" />
            </div>
          ) : hasNote && noteContent ? (
            <NoteContent docName={doc.name} content={noteContent} />
          ) : (
            <GenericDocContent doc={doc} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Note content (free-text) ─────────────────────────────────
function NoteContent({ docName, content }: { docName: string; content: string }) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  function handleCopy() {
    navigator.clipboard.writeText(content);
    toast.success("Copié dans le presse-papier");
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docName.replace(/[^a-zA-Z0-9-_]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Téléchargement lancé");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          Note · contenu injecté dans le contexte agent
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{wordCount} mots</span>
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          >
            Copier
          </button>
          <button
            onClick={handleDownload}
            className="px-2 py-1 rounded text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          >
            ↓ Télécharger .txt
          </button>
        </div>
      </div>
      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-loose whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

// ─── Generic doc (fallback : PDF en cours / note sans contenu) ─
function GenericDocContent({ doc }: { doc: Document }) {
  const isNote = !doc.storagePath;
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 text-2xl">
        📄
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{doc.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-6">
        {doc.size} · {doc.updatedAt}
      </p>
      {isNote ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-600">Aucun contenu disponible</p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-600">Chargement du fichier…</p>
      )}
    </div>
  );
}

