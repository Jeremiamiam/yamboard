"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { usePendingSuggestionsStore } from "@/lib/pending-suggestions-store";
import { fetchPendingSuggestions } from "@/lib/data/client-queries";

/** Realtime + chargement initial pour les suggestions email en attente. */
export function usePendingSuggestionsRealtime() {
  const loadData = useStore((s) => s.loadData);
  const add = usePendingSuggestionsStore((s) => s.add);
  const setItems = usePendingSuggestionsStore((s) => s.setItems);

  useEffect(() => {
    fetchPendingSuggestions(20)
      .then((rows) => {
        setItems(
          rows.map((r) => ({
            id: r.id,
            clientId: r.clientId,
            projectId: r.projectId ?? undefined,
            type: r.type,
            data: r.data,
            fromEmail: r.fromEmail ?? undefined,
            subject: r.subject ?? undefined,
            senderName: r.senderName ?? undefined,
            createdAt: r.createdAt,
          }))
        );
      })
      .catch((err) => console.error("[usePendingSuggestionsRealtime] fetch failed:", err));
  }, [setItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("pending-email-suggestions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pending_email_suggestions",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const type = row.type as "contact" | "note";
          const data = (row.data as { name?: string; email?: string }) ?? {};
          const suggestion = {
            id: row.id as string,
            clientId: row.client_id as string,
            projectId: (row.project_id as string) ?? undefined,
            type,
            data,
            fromEmail: (row.from_email as string) ?? undefined,
            subject: (row.subject as string) ?? undefined,
            senderName: (row.sender_name as string) ?? undefined,
            createdAt: (row.created_at as string) ?? new Date().toISOString(),
          };
          add(suggestion);
          const label = type === "contact" ? "Potentiel contact" : "Résumé d'échange";
          const detail = type === "contact" ? data.name ?? data.email ?? "—" : data.name ?? "—";
          toast.info(`${label} à valider`, {
            description: `« ${detail} » — Ouvre la cloche pour Oui/Non`,
          });
          loadData().catch((err) => {
            console.error("[usePendingSuggestionsRealtime] loadData failed:", err);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "pending_email_suggestions",
        },
        (payload) => {
          const old = payload.old as Record<string, unknown>;
          usePendingSuggestionsStore.getState().remove(old.id as string);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, add]);
}
