"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { useNotificationsStore } from "@/lib/notifications-store";
import { fetchRecentActivityForNotifications } from "@/lib/data/client-queries";

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

          addNotification({
            id: row.id as string,
            clientId: row.client_id as string,
            actionType: row.action_type as string,
            summary: row.summary as string,
            source,
            createdAt: (row.created_at as string) ?? new Date().toISOString(),
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
