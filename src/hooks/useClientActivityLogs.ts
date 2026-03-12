"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchClientActivityLogs, type ClientActivityRow } from "@/lib/data/client-queries";

export function useClientActivityLogs(clientId: string | null, limit = 15) {
  const [logs, setLogs] = useState<ClientActivityRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  return { logs, loading, refresh };
}
