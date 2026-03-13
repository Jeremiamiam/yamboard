"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { useNotificationsStore } from "@/lib/notifications-store";
import { fetchRecentActivityForNotifications } from "@/lib/data/client-queries";

const ACTION_LABELS: Record<string, string> = {
  contact_added: "Contact ajouté",
  note_added: "Note ajoutée",
  document_uploaded: "Document uploadé",
  email_summary: "Email traité",
};

/** Realtime + chargement initial pour la cloche de notifications. */
export function useEmailActivityRealtime() {
  const loadData = useStore((s) => s.loadData);
  const addNotification = useNotificationsStore((s) => s.add);
  const hydrate = useNotificationsStore((s) => s.hydrate);

  // Chargement initial au montage (évite de dépendre uniquement du Realtime)
  useEffect(() => {
    fetchRecentActivityForNotifications(20)
      .then((rows) => {
        hydrate(
          rows.map((r) => ({
            id: r.id,
            clientId: r.clientId,
            actionType: r.actionType,
            summary: r.summary,
            source: r.source,
            createdAt: r.createdAt,
          }))
        );
      })
      .catch((err) => console.error("[useEmailActivityRealtime] fetch initial failed:", err));
  }, [hydrate]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("email-activity-logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_activity_logs",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const source = row.source as string;
          if (source !== "email") return;

          const clientId = row.client_id as string;
          const actionType = row.action_type as string;
          const summary = row.summary as string;

          addNotification({
            id: row.id as string,
            clientId,
            actionType,
            summary,
            source,
            createdAt: (row.created_at as string) ?? new Date().toISOString(),
          });

          const label = ACTION_LABELS[actionType] ?? actionType;
          toast.info(label, {
            description: summary.slice(0, 100) + (summary.length > 100 ? "…" : ""),
          });

          loadData().catch((err) => {
            console.error("[useEmailActivityRealtime] loadData failed:", err);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, addNotification]);
}
