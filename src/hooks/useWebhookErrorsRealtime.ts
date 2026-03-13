"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useWebhookErrorsStore } from "@/lib/webhook-errors-store";
import { fetchWebhookErrors } from "@/lib/data/client-queries";

/** Realtime + chargement initial pour les erreurs webhook (Resend, agent). */
export function useWebhookErrorsRealtime() {
  const add = useWebhookErrorsStore((s) => s.add);
  const setItems = useWebhookErrorsStore((s) => s.setItems);

  useEffect(() => {
    fetchWebhookErrors(20)
      .then((rows) => {
        setItems(
          rows.map((r) => ({
            id: r.id,
            source: r.source,
            errorMessage: r.errorMessage,
            details: r.details ?? undefined,
            createdAt: r.createdAt,
          }))
        );
      })
      .catch((err) => console.error("[useWebhookErrorsRealtime] fetch failed:", err));
  }, [setItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("webhook-errors")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webhook_errors",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const error = {
            id: row.id as string,
            source: (row.source as string) ?? "inbound_email",
            errorMessage: (row.error_message as string) ?? "Erreur inconnue",
            details: (row.details as Record<string, unknown>) ?? undefined,
            createdAt: (row.created_at as string) ?? new Date().toISOString(),
          };
          add(error);
          toast.error("Erreur Resend / Agent", {
            description: `« ${error.errorMessage} » — Ouvre la cloche pour les détails`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [add]);
}
