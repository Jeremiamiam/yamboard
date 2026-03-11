import { useState, useEffect } from "react";
import { fetchContactsForClient, type ContactRow } from "@/lib/data/client-queries";

export function useClientContacts(clientId: string | undefined) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);

  useEffect(() => {
    if (!clientId) return;
    fetchContactsForClient(clientId).then(setContacts);
  }, [clientId]);

  const refresh = () => {
    if (clientId) fetchContactsForClient(clientId).then(setContacts);
  };

  return { contacts, setContacts, refresh };
}
