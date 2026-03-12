"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClientActivityLogs } from "@/hooks/useClientActivityLogs";
import { deleteActivityLogAction } from "@/lib/store/actions";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { ClientActivityRow } from "@/lib/data/client-queries";

const SOURCE_LABELS: Record<string, string> = {
  email: "Email",
  chat: "Chat",
  manual: "Manuel",
};

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

type Props = {
  clientId: string;
  compact?: boolean;
  scrollable?: boolean;
};

export function ClientActivityFeed({ clientId, compact, scrollable }: Props) {
  const { logs, loading, refresh } = useClientActivityLogs(clientId, 15);
  const [expandedLog, setExpandedLog] = useState<ClientActivityRow | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!expandedLog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedLog(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expandedLog]);

  const hasExpandableContent = (log: ClientActivityRow): boolean =>
    Boolean(log.metadata?.content && typeof log.metadata.content === "string");

  if (loading && logs.length === 0) {
    return (
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activité récente
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-600">Chargement…</p>
      </section>
    );
  }

  if (logs.length === 0) {
    return (
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activité récente
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-600 py-4">
          Aucune activité enregistrée. Les actions par email, chat ou manuelles apparaîtront ici.
        </p>
      </section>
    );
  }

  const listClassName = scrollable
    ? "space-y-2 max-h-[280px] overflow-y-auto overscroll-contain"
    : "space-y-2";
  const itemClassName = compact
    ? "flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
    : "flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800";

  return (
    <section className={scrollable ? "flex flex-col min-h-0" : undefined}>
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-2 shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Activité récente ({logs.length})
      </h2>
      <ul className={listClassName}>
        {logs.map((log) => (
          <li
            key={log.id}
            className={`${itemClassName} ${
              hasExpandableContent(log)
                ? "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                : ""
            }`}
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
                {log.summary}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5 truncate">
                {SOURCE_LABELS[log.source] ?? log.source} · {formatRelativeTime(log.createdAt)}
                {hasExpandableContent(log) ? " · Résumé" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startTransition(async () => {
                  const err = await deleteActivityLogAction(log.id);
                  if (!err.error) refresh();
                });
              }}
              disabled={isPending}
              className="shrink-0 p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
              aria-label="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
              <div
                className="min-w-[50vw] min-h-[50vh] max-w-[90vw] max-h-[90vh] w-full flex flex-col rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 id="log-dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
                {expandedLog.summary}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
                {SOURCE_LABELS[expandedLog.source] ?? expandedLog.source} ·{" "}
                {formatRelativeTime(expandedLog.createdAt)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2">
                <MarkdownContent content={String(expandedLog.metadata!.content)} />
              </div>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setExpandedLog(null)}
                className="px-4 py-2 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
            document.body
          )
        : null}
    </section>
  );
}
