"use client";

import { useClientActivityLogs } from "@/hooks/useClientActivityLogs";

const ACTION_ICONS: Record<string, string> = {
  email_summary: "📧",
  contact_added: "👤",
  note_added: "📝",
  link_added: "🔗",
  project_created: "📁",
  product_added: "💰",
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
            className="flex gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
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
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
