"use client";

import { useEffect, useState } from "react";
import { DOC_TYPE_LABEL, DOC_TYPE_COLOR, type Document } from "@/lib/types";
import { getDocumentSignedUrl } from "@/app/(dashboard)/actions/documents";

// ─── Component ───────────────────────────────────────────────
export function DocumentViewer({
  doc,
  onClose,
}: {
  doc: Document | null;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    // Reset pdfUrl when doc changes
    setPdfUrl(null);

    if (doc?.storagePath) {
      getDocumentSignedUrl(doc.storagePath).then((result) => {
        if ("signedUrl" in result) {
          setPdfUrl(result.signedUrl);
        }
      });
    }
  }, [doc?.storagePath]);

  if (!doc) return null;

  const typeLabel = DOC_TYPE_LABEL[doc.type];
  const typeColor = DOC_TYPE_COLOR[doc.type];

  const hasNote = !!doc.content?.trim();

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
            <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${typeColor}`}>
              {typeLabel}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{doc.name}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5">
              Mis à jour le {doc.updatedAt} · {doc.size}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              ↓ Exporter
            </button>
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
          ) : hasNote ? (
            <NoteContent content={doc.content!} />
          ) : (
            <GenericDocContent doc={doc} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Note content (free-text) ─────────────────────────────────
function NoteContent({ content }: { content: string }) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          Note · contenu injecté dans le contexte agent
        </p>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{wordCount} mots</span>
      </div>
      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-loose whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

// ─── Generic doc ──────────────────────────────────────────────
function GenericDocContent({ doc }: { doc: Document }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 text-2xl">
        📄
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{doc.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-6">
        {doc.size} · {doc.updatedAt}
      </p>
      <button className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors">
        ↓ Ouvrir le fichier
      </button>
    </div>
  );
}

