"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClientActivityLogs } from "@/hooks/useClientActivityLogs";
import {
  addManualActivityLogAction,
  convertActivityLogToDocumentAction,
  deleteActivityLogAction,
} from "@/lib/store/actions";
import { useStore } from "@/lib/store";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Button, Surface, SectionHeader, Textarea } from "@/components/ui";
import type { ClientActivityRow } from "@/lib/data/client-queries";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3600_000);
  const diffDays = Math.floor(diffMs / 86400_000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Titre = résumé du contenu (metadata.name ou première ligne), pas "ajoutée par X" */
function getLogTitle(log: ClientActivityRow): string {
  const name = log.metadata?.name
  if (typeof name === "string" && name.trim()) return name.trim()
  const content = log.metadata?.content
  if (typeof content === "string" && content.trim()) {
    const firstLine = content.split("\n")[0]?.trim()
    if (firstLine) return firstLine.slice(0, 80)
  }
  return log.summary.slice(0, 80)
}

/** Auteur en petit : profil > sender email > source */
function getLogByline(log: ClientActivityRow): string {
  if (log.ownerName) return log.ownerName
  if (log.source === "email" && log.metadata?.sender) {
    const from = String(log.metadata.sender)
    const nameMatch = from.match(/^([^<]+)</)
    if (nameMatch) return nameMatch[1].trim()
    if (from.includes("@")) return from.split("@")[0].trim()
  }
  if (log.source === "chat") return "Chat"
  if (log.source === "manual") return "Manuel"
  return log.source
}

type Props = {
  clientId: string;
  compact?: boolean;
  scrollable?: boolean;
};

export function ClientActivityFeed({ clientId, compact, scrollable }: Props) {
  const { logs, loading, refresh } = useClientActivityLogs(clientId, 15);
  const [expandedLog, setExpandedLog] = useState<ClientActivityRow | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addText, setAddText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!expandedLog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedLog(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expandedLog]);

  useEffect(() => {
    if (!showAddModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setAddText("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAddModal]);

  const hasExpandableContent = (log: ClientActivityRow): boolean =>
    Boolean(log.metadata?.content && typeof log.metadata.content === "string");

  if (loading && logs.length === 0) {
    return (
      <section>
        <SectionHeader level="sublabel" as="h2" className="flex items-center gap-1.5 mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activité récente
        </SectionHeader>
        <p className="text-sm text-zinc-500 dark:text-zinc-600">Chargement…</p>
      </section>
    );
  }

  const addButton = (
    <Button
      variant="secondary"
      size="icon_sm"
      onClick={() => setShowAddModal(true)}
      aria-label="Ajouter une entrée"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </Button>
  );

  const addModal =
    showAddModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setShowAddModal(false);
              setAddText("");
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-log-dialog-title"
          >
            <Surface
              variant="overlay"
              className="w-full max-w-md rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <SectionHeader level="h2" as="h2" id="add-log-dialog-title">
                  Ajouter une entrée au journal
                </SectionHeader>
                <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
                  Collez ou rédigez le texte à enregistrer.
                </p>
              </div>
              <form
                className="p-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    const err = await addManualActivityLogAction({
                      clientId,
                      summary: addText.trim(),
                      content: addText.trim(),
                    });
                    if (!err.error) {
                      setShowAddModal(false);
                      setAddText("");
                      refresh();
                    }
                  });
                }}
              >
                <Textarea
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  placeholder="Résumé d'échange, note, info importante…"
                  rows={4}
                  className="focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddText("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!addText.trim() || isPending}
                  >
                    {isPending ? "Ajout…" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Surface>
          </div>,
          document.body
        )
      : null;

  if (logs.length === 0 && !loading) {
    return (
      <section>
        <div className="flex items-center justify-between gap-2 mb-4">
          <SectionHeader level="sublabel" as="h2" className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activité récente
          </SectionHeader>
          {addButton}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-600 py-4">
          Aucune activité enregistrée. Les emails (Resend) et entrées manuelles apparaîtront ici.
        </p>
        {addModal}
      </section>
    );
  }

  const listClassName = scrollable
    ? "space-y-2 max-h-[280px] overflow-y-auto overscroll-contain"
    : "space-y-2";

  return (
    <section className={scrollable ? "flex flex-col min-h-0" : undefined}>
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <SectionHeader level="sublabel" as="h2" className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activité récente ({logs.length})
        </SectionHeader>
        {addButton}
      </div>
      <ul className={listClassName}>
        {logs.map((log) => (
          <li key={log.id}>
            <Surface
              variant={hasExpandableContent(log) ? "interactive" : "card"}
              padding={compact ? "sm" : "sm"}
              className={`flex items-start ${compact ? "gap-2" : "gap-3"} ${compact ? "!p-2" : ""}`}
              onClick={() =>
                hasExpandableContent(log) && setExpandedLog(expandedLog?.id === log.id ? null : log)
              }
              role={hasExpandableContent(log) ? "button" : undefined}
              tabIndex={hasExpandableContent(log) ? 0 : undefined}
              onKeyDown={(e) =>
                hasExpandableContent(log) &&
                (e.key === "Enter" || e.key === " ") &&
                setExpandedLog(expandedLog?.id === log.id ? null : log)
              }
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {getLogTitle(log)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5 truncate">
                  <span className="text-amber-600 dark:text-amber-500">{getLogByline(log)}</span>
                  {" · "}
                  {formatRelativeTime(log.createdAt)}
                  {hasExpandableContent(log) ? " · Résumé" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon_sm"
                onClick={(e) => {
                  e.stopPropagation();
                  startTransition(async () => {
                    const err = await deleteActivityLogAction(log.id);
                    if (!err.error) refresh();
                  });
                }}
                disabled={isPending}
                aria-label="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </Surface>
          </li>
        ))}
      </ul>

      {expandedLog && hasExpandableContent(expandedLog) && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
              onClick={() => setExpandedLog(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="log-dialog-title"
            >
              <Surface
                variant="overlay"
                className="min-w-[50vw] min-h-[50vh] max-w-[90vw] max-h-[90vh] w-full flex flex-col rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <SectionHeader level="h2" as="h2" id="log-dialog-title">
                {getLogTitle(expandedLog)}
              </SectionHeader>
              <p className="text-xs mt-1.5">
                <span className="text-amber-600 dark:text-amber-500 font-medium">
                  {getLogByline(expandedLog)}
                </span>
                {" · "}
                <span className="text-zinc-500 dark:text-zinc-600">
                  {formatRelativeTime(expandedLog.createdAt)}
                </span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2">
                <MarkdownContent content={String(expandedLog.metadata!.content)} />
              </div>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <Button
                variant="primary"
                onClick={() => {
                  startTransition(async () => {
                    const err = await convertActivityLogToDocumentAction(expandedLog.id);
                    if (!err.error) {
                      setExpandedLog(null);
                      refresh();
                      useStore.getState().loadData();
                    }
                  });
                }}
                disabled={isPending}
              >
                {isPending ? "Conversion…" : "Convertir en document client"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setExpandedLog(null)}
              >
                Fermer
              </Button>
            </div>
          </Surface>
        </div>,
            document.body
          )
        : null}
      {addModal}
    </section>
  );
}
