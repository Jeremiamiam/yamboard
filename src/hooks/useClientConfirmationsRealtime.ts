"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useClientConfirmationsStore } from "@/lib/client-confirmations-store";
import { fetchClientConfirmations } from "@/lib/data/client-queries";

/** Realtime + chargement initial pour les confirmations client (Brutos = BRUTUS ?). */
export function useClientConfirmationsRealtime() {
  const add = useClientConfirmationsStore((s) => s.add);
  const setItems = useClientConfirmationsStore((s) => s.setItems);
  const remove = useClientConfirmationsStore((s) => s.remove);

  useEffect(() => {
    fetchClientConfirmations(20)
      .then((rows) => {
        setItems(
          rows.map((r) => ({
            id: r.id,
            mentionedName: r.mentionedName,
            possibleMatchClientId: r.possibleMatchClientId ?? undefined,
            possibleMatchName: r.possibleMatchName ?? undefined,
            fromEmail: r.fromEmail ?? undefined,
            subject: r.subject ?? undefined,
            createdAt: r.createdAt,
          }))
        );
      })
      .catch((err) => console.error("[useClientConfirmationsRealtime] fetch failed:", err));
  }, [setItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("client-confirmations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pending_client_confirmations",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const item = {
            id: row.id as string,
            mentionedName: (row.mentioned_name as string) ?? "",
            possibleMatchClientId: (row.possible_match_client_id as string) ?? undefined,
            possibleMatchName: (row.possible_match_name as string) ?? undefined,
            fromEmail: (row.from_email as string) ?? undefined,
            subject: (row.subject as string) ?? undefined,
            createdAt: (row.created_at as string) ?? new Date().toISOString(),
          };
          add(item);
          const q = row.possible_match_name
            ? `« ${row.mentioned_name} » = « ${row.possible_match_name} » ?`
            : `Créer le client « ${row.mentioned_name} » ?`;
          toast.info("Confirmation client", {
            description: q + " — Ouvre la cloche",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "pending_client_confirmations",
        },
        (payload) => {
          const old = payload.old as Record<string, unknown>;
          remove(old.id as string);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [add, remove]);
}
