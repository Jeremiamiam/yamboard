"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

const ACTION_LABELS: Record<string, string> = {
  client_created: "Client créé",
  project_created: "Projet créé",
  product_added: "Produit ajouté",
  note_added: "Note ajoutée",
  link_added: "Lien ajouté",
  contact_added: "Contact ajouté",
  document_uploaded: "Document uploadé",
  email_summary: "Email traité",
};

/** Realtime : toast quand un log d'activité (source=email) est créé. */
export function useEmailActivityRealtime() {
  const loadData = useStore((s) => s.loadData);

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

          const actionType = row.action_type as string;
          const summary = row.summary as string;
          const label = ACTION_LABELS[actionType] ?? actionType;

          toast.success(label, {
            description: summary,
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
  }, [loadData]);
}
