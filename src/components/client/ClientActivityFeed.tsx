"use client";

import { useState } from "react";
import { useClientActivityLogs } from "@/hooks/useClientActivityLogs";
import type { ClientActivityRow } from "@/lib/data/client-queries";

const ACTION_ICONS: Record<string, string> = {
  email_summary: "📧",
  contact_added: "👤",
  note_added: "📝",
  link_added: "🔗",
  project_created: "📁",
  product_added: "💰",
  payment_updated: "💳",
  client_created: "✨",
  document_uploaded: "📄",
};

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
};

export function ClientActivityFeed({ clientId }: Props) {
  const { logs, loading } = useClientActivityLogs(clientId, 15);
  const [expandedLog, setExpandedLog] = useState<ClientActivityRow | null>(null);

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

  return (
    <section>
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mb-4">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Activité récente ({logs.length})
      </h2>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className={`flex gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${
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
            <span className="text-lg shrink-0" aria-hidden>
              {ACTION_ICONS[log.actionType] ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{log.summary}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5 flex items-center gap-2">
                <span>{SOURCE_LABELS[log.source] ?? log.source}</span>
                <span>·</span>
                <span>{formatRelativeTime(log.createdAt)}</span>
                {hasExpandableContent(log) ? (
                  <span className="text-zinc-400">· Cliquer pour voir le résumé</span>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {expandedLog && hasExpandableContent(expandedLog) ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setExpandedLog(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-dialog-title"
        >
          <div
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="log-dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {expandedLog.summary}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mb-4">
              {SOURCE_LABELS[expandedLog.source] ?? expandedLog.source} ·{" "}
              {formatRelativeTime(expandedLog.createdAt)}
            </p>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {String(expandedLog.metadata!.content)}
            </div>
            <button
              onClick={() => setExpandedLog(null)}
              className="mt-4 px-4 py-2 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
