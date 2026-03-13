"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchClientActivityLogs, type ClientActivityRow } from "@/lib/data/client-queries";

export function useClientActivityLogs(clientId: string | null, limit = 15) {
  const [logs, setLogs] = useState<ClientActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await fetchClientActivityLogs(clientId, limit);
      setLogs(data);
    } catch (err) {
      console.error("[useClientActivityLogs]", err);
    } finally {
      setLoading(false);
    }
  }, [clientId, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime : auto-refresh quand un nouveau log arrive pour ce client
  useEffect(() => {
    if (!clientId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`client-activity-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_activity_logs",
          filter: `client_id=eq.${clientId}`,
        },
        () => refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "client_activity_logs",
          filter: `client_id=eq.${clientId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, refresh]);

  return { logs, loading, refresh };
}
