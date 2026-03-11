"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { fetchAllDocuments } from "@/lib/data/client-queries";
import type { Document } from "@/lib/types";

function rowToDocUpdates(row: Record<string, unknown>): Partial<Document> {
  const content = (row.content as string | null) ?? undefined;
  const size = content
    ? `~${content.split(/\s+/).filter(Boolean).length} mots`
    : "—";
  return {
    extractionStatus: (row.extraction_status as Document["extractionStatus"]) ?? undefined,
    content,
    size,
    updatedAt: row.updated_at
      ? new Date(row.updated_at as string).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : undefined,
  };
}

function fireExtractionToast(docName: string, status: Document["extractionStatus"]) {
  if (status === "done") {
    toast.success(`Extraction terminée — ${docName}`, {
      description: "Le contenu du PDF est maintenant disponible dans le contexte chat.",
    });
  } else if (status === "failed") {
    toast.error(`Échec d'extraction — ${docName}`, {
      description: "Le PDF n'a pas pu être analysé.",
    });
  }
}

/** Realtime + polling : met à jour le store quand extraction_status change. */
export function useDocumentExtractionRealtime() {
  const documents = useStore((s) => s.documents);
  const updateDocument = useStore((s) => s.updateDocument);
  const setDocuments = useStore((s) => s.setDocuments);
  const hasProcessing = documents.some((d) => d.extractionStatus === "processing");

  // Keep a ref to the latest documents to compare statuses in callbacks
  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  useEffect(() => {
    if (!hasProcessing) return;

    const supabase = createClient();
    const channel = supabase
      .channel("documents-extraction")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const id = newRow.id as string;
          const updates = rowToDocUpdates(newRow);
          if (Object.keys(updates).length > 0) {
            const prev = documentsRef.current.find((d) => d.id === id);
            if (prev?.extractionStatus === "processing" && updates.extractionStatus !== "processing") {
              fireExtractionToast(prev.name, updates.extractionStatus);
            }
            updateDocument(id, updates);
          }
        }
      )
      .subscribe();

    // Fallback polling si Realtime indisponible (ex. config Supabase)
    const poll = setInterval(async () => {
      const prev = documentsRef.current;
      const fresh = await fetchAllDocuments();
      const stillProcessing = fresh.some((d) => d.extractionStatus === "processing");

      // Detect status changes via polling
      for (const doc of fresh) {
        const prevDoc = prev.find((d) => d.id === doc.id);
        if (prevDoc?.extractionStatus === "processing" && doc.extractionStatus !== "processing") {
          fireExtractionToast(doc.name, doc.extractionStatus);
        }
      }

      setDocuments(fresh);
      if (!stillProcessing) clearInterval(poll);
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [hasProcessing, updateDocument, setDocuments]);
}
