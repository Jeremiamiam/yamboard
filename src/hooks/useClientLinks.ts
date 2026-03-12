import { useState, useEffect } from "react";
import { fetchClientLinks, type ClientLinkRow } from "@/lib/data/client-queries";

export function useClientLinks(clientId: string | undefined) {
  const [links, setLinks] = useState<ClientLinkRow[]>([]);

  useEffect(() => {
    if (!clientId) return;
    fetchClientLinks(clientId)
      .then(setLinks)
      .catch(() => setLinks([]));
  }, [clientId]);

  const refresh = () => {
    if (clientId) fetchClientLinks(clientId).then(setLinks).catch(() => setLinks([]));
  };

  return { links, setLinks, refresh };
}
