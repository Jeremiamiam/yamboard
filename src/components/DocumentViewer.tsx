"use client";

import { useEffect, useMemo, useState } from "react";
import type { Document } from "@/lib/types";
import { getDocumentSignedUrl, getDocument, getDocumentFileContent } from "@/app/(dashboard)/actions/documents";
import { DeleteMenu } from "@/components/DeleteMenu";
import { toast } from "sonner";
import { Backdrop } from "@/components/ui/Dialog";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { IconBox } from "@/components/ui/IconBox";

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
    setPdfUrl(null);
    setFetchedContent(null);

    const path = doc?.storagePath ?? "";
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const isHtmlFile = ext === "html" || doc?.name?.toLowerCase().endsWith(".html");
    const isBinaryFile = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "doc", "docx"].includes(ext);

    if (doc?.storagePath) {
      if (isBinaryFile) {
        getDocumentSignedUrl(doc.storagePath).then((r) => {
          if ("signedUrl" in r) setPdfUrl(r.signedUrl);
        });
      } else {
        setFetchedContent("loading");
        getDocumentFileContent(doc.storagePath).then((result) => {
          if ("content" in result && (isHtmlFile || isHtmlContent(result.content))) {
            setFetchedContent(result.content);
          } else {
            setFetchedContent(null);
            getDocumentSignedUrl(doc.storagePath).then((r) => {
              if ("signedUrl" in r) setPdfUrl(r.signedUrl);
            });
          }
        });
      }
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
  const isLoadingContent = fetchedContent === "loading";

  return (
    <>
      <Backdrop onClose={onClose} className="bg-black/60" />

      <Surface variant="overlay" className="fixed top-0 right-0 bottom-0 z-50 w-[70vw] min-w-[320px] flex flex-col border-l overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <SectionHeader level="h2">{doc.name}</SectionHeader>
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
            <Button
              variant="secondary"
              size="icon_md"
              onClick={onClose}
            >
              ✕
            </Button>
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
          ) : isLoadingContent ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-400 rounded-full animate-spin" />
            </div>
          ) : hasNote && noteContent ? (
            isHtmlContent(noteContent) ? (
              <HtmlContent
                docName={doc.name}
                content={decodeHtmlEntities(noteContent)}
              />
            ) : (
              <NoteContent docName={doc.name} content={noteContent} />
            )
          ) : (
            <GenericDocContent doc={doc} />
          )}
        </div>
      </Surface>
    </>
  );
}

// ─── HTML content ─────────────────────────────────────────────
function isHtmlContent(content: string): boolean {
  const s = content.trim().replace(/^\uFEFF/, "");
  return (
    s.includes("<!DOCTYPE") ||
    s.includes("<html") ||
    s.includes("&lt;!DOCTYPE") ||
    s.includes("&lt;html") ||
    /<\s*(html|head|body|style)\b/i.test(s)
  );
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function HtmlContent({ docName, content }: { docName: string; content: string }) {
  const blobUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return URL.createObjectURL(new Blob([content], { type: "text/html; charset=utf-8" }));
  }, [content]);

  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  if (!blobUrl) return null;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
      <iframe
        src={blobUrl}
        sandbox="allow-same-origin"
        title={docName}
        className="w-full min-h-[500px] border-0"
        style={{ height: "70vh" }}
      />
    </div>
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
        <SectionHeader level="label">
          Note · contenu injecté dans le contexte agent
        </SectionHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{wordCount} mots</span>
          <Button variant="secondary" size="xs" onClick={handleCopy}>
            Copier
          </Button>
          <Button variant="secondary" size="xs" onClick={handleDownload}>
            ↓ Télécharger .txt
          </Button>
        </div>
      </div>
      <Surface variant="muted" padding="md">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-loose whitespace-pre-wrap">
          {content}
        </p>
      </Surface>
    </div>
  );
}

// ─── Generic doc (fallback : PDF en cours / note sans contenu) ─
function GenericDocContent({ doc }: { doc: Document }) {
  const isNote = !doc.storagePath;
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <IconBox size="xl" variant="surface" className="mb-4">
        📄
      </IconBox>
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
