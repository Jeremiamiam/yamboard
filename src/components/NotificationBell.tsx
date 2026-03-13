"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useNotificationsStore } from "@/lib/notifications-store";
import { usePendingSuggestionsStore } from "@/lib/pending-suggestions-store";
import { useWebhookErrorsStore } from "@/lib/webhook-errors-store";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  approveContactSuggestion,
  approveNoteSuggestion,
  rejectSuggestion,
} from "@/app/(dashboard)/actions/email-suggestions";
import { dismissWebhookError } from "@/app/(dashboard)/actions/webhook-errors";
import { MOCK_PENDING_SUGGESTIONS } from "@/lib/pending-suggestions-store";
import { MOCK_ACTIVITY_NOTIFICATIONS } from "@/lib/notifications-store";

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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const items = useNotificationsStore((s) => s.items);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const pendingItems = usePendingSuggestionsStore((s) => s.items);
  const removePending = usePendingSuggestionsStore((s) => s.remove);
  const webhookErrors = useWebhookErrorsStore((s) => s.items);
  const removeWebhookError = useWebhookErrorsStore((s) => s.remove);
  const setPendingItems = usePendingSuggestionsStore((s) => s.setItems);
  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const navigateTo = useStore((s) => s.navigateTo);
  const loadData = useStore((s) => s.loadData);
  const clients = useStore((s) => s.clients);

  const totalBadge = unreadCount + pendingItems.length + webhookErrors.length;

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

  async function handleApprove(s: (typeof pendingItems)[0]) {
    if (processingId) return;
    setProcessingId(s.id);
    const isMock = s.id.startsWith("mock-");
    try {
      if (isMock) {
        removePending(s.id);
        toast.success(s.type === "contact" ? "Contact ajouté" : "Note ajoutée");
      } else {
        const result =
          s.type === "contact"
            ? await approveContactSuggestion(s.id)
            : await approveNoteSuggestion(s.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          removePending(s.id);
          toast.success(s.type === "contact" ? "Contact ajouté" : "Note ajoutée");
          loadData().catch(() => {});
        }
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(s: (typeof pendingItems)[0]) {
    if (processingId) return;
    setProcessingId(s.id);
    const isMock = s.id.startsWith("mock-");
    try {
      if (isMock) {
        removePending(s.id);
      } else {
        const result = await rejectSuggestion(s.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          removePending(s.id);
        }
      }
    } finally {
      setProcessingId(null);
    }
  }

  function loadMockData() {
    setPendingItems(MOCK_PENDING_SUGGESTIONS);
    hydrateNotifications(MOCK_ACTIVITY_NOTIFICATIONS);
    toast.success("Mock chargé — Oui/Non fonctionnent sur les suggestions");
  }

  const getClientName = (clientId: string) =>
    clientId === "mock-client"
      ? "Client démo"
      : clients.find((c) => c.id === clientId)?.name ?? "Client";

  const hasContent = pendingItems.length > 0 || items.length > 0 || webhookErrors.length > 0;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon_md"
        onClick={() => {
          setOpen((v) => !v);
          if (open) markAllRead();
        }}
        title="Notifications"
        aria-label="Notifications"
        className="relative"
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
        {totalBadge > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500"
            aria-hidden
          />
        )}
      </Button>

      {open && (
        <Surface variant="overlay" className="absolute right-0 top-full mt-1 w-80 max-h-[420px] overflow-hidden rounded-xl shadow-xl z-50 flex flex-col">
          <div className="shrink-0 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <SectionHeader level="sublabel">Notifications</SectionHeader>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={loadMockData}
                title="Charger des données mock pour preview"
              >
                Preview mock
              </Button>
              {items.length > 0 && (
                <Button variant="ghost" size="xs" onClick={markAllRead}>
                  Tout marquer lu
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {!hasContent ? (
              <p className="px-3 py-6 text-sm text-zinc-500 dark:text-zinc-500 text-center">
                Aucune notification
              </p>
            ) : (
              <div className="py-1">
                {webhookErrors.length > 0 && (
                  <div className="border-b border-zinc-200 dark:border-zinc-800">
                    <p className="px-3 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                      Erreurs
                    </p>
                    <ul>
                      {webhookErrors.map((e) => (
                        <li
                          key={e.id}
                          className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 bg-red-50/50 dark:bg-red-950/20"
                        >
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            Erreur Resend / Agent
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                            {e.errorMessage}
                          </p>
                          {e.details?.stack != null ? (
                            <pre className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-500 overflow-x-auto max-h-24 overflow-y-auto break-all whitespace-pre-wrap">
                              {String(e.details.stack)}
                            </pre>
                          ) : null}
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-1">
                            {formatRelativeTime(e.createdAt)}
                          </p>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="mt-2 text-zinc-500"
                            onClick={async () => {
                              const result = await dismissWebhookError(e.id);
                              if (result.error) {
                                toast.error(result.error);
                              } else {
                                removeWebhookError(e.id);
                                toast.success("Erreur retirée");
                              }
                            }}
                          >
                            Retirer
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pendingItems.length > 0 && (
                  <div className="border-b border-zinc-200 dark:border-zinc-800">
                    <p className="px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                      À valider
                    </p>
                    <ul>
                      {pendingItems.map((s) => {
                        const isProcessing = processingId === s.id;
                        const label =
                          s.type === "contact"
                            ? `Contact « ${s.data.name ?? "—"} »${s.data.email ? ` (${s.data.email})` : ""}`
                            : `Résumé « ${s.data.name ?? "Échange"} »`;
                        return (
                          <li
                            key={s.id}
                            className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                          >
                            <p className="text-sm text-zinc-800 dark:text-zinc-200">
                              {s.type === "contact"
                                ? "Potentiel contact trouvé"
                                : "Résumé d'échange trouvé"}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                              {label} · {getClientName(s.clientId)}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleApprove(s)}
                                disabled={isProcessing}
                              >
                                Oui
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleReject(s)}
                                disabled={isProcessing}
                              >
                                Non
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {items.length > 0 && (
                  <div>
                    {pendingItems.length > 0 && (
                      <p className="px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                        Derniers updates
                      </p>
                    )}
                    <ul>
                      {items.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => handleItemClick(n.clientId)}
                            className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 cursor-pointer"
                          >
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {ACTION_LABELS[n.actionType] ?? n.actionType} ·{" "}
                              {getClientName(n.clientId)}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 line-clamp-2">
                              {n.summary}
                            </p>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-1">
                              {SOURCE_LABELS[n.source] ?? n.source} ·{" "}
                              {formatRelativeTime(n.createdAt)}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Surface>
      )}
    </div>
  );
}
