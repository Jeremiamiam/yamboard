"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useNotificationsStore } from "@/lib/notifications-store";
import { useStore } from "@/lib/store";

const ACTION_LABELS: Record<string, string> = {
  client_created: "Client créé",
  project_created: "Projet créé",
  product_added: "Produit ajouté",
  payment_updated: "Budget mis à jour",
  note_added: "Note ajoutée",
  link_added: "Lien ajouté",
  contact_added: "Contact ajouté",
  document_uploaded: "Document uploadé",
  email_summary: "Email traité",
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = useNotificationsStore((s) => s.items);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const navigateTo = useStore((s) => s.navigateTo);
  const clientsSlice = useStore((s) => s.clients);
  const prospectsSlice = useStore((s) => s.prospects);
  const clients = useMemo(() => [...clientsSlice, ...prospectsSlice], [clientsSlice, prospectsSlice]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  function handleItemClick(clientId: string) {
    setOpen(false);
    markAllRead();
    navigateTo(clientId);
  }

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? "Client";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (open) markAllRead();
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-[400px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-50 flex flex-col">
          <div className="shrink-0 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Derniers updates
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-zinc-500 dark:text-zinc-500 text-center">
                Aucune notification
              </p>
            ) : (
              <ul className="py-1">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n.clientId)}
                      className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                    >
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {ACTION_LABELS[n.actionType] ?? n.actionType} · {getClientName(n.clientId)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 line-clamp-2">
                        {n.summary}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-1">
                        {SOURCE_LABELS[n.source] ?? n.source} · {formatRelativeTime(n.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
