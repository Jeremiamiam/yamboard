/**
 * Store pour les suggestions email en attente (contact, note).
 * Affichées dans la cloche avec boutons Oui/Non.
 */

import { create } from "zustand";

export type PendingSuggestion = {
  id: string;
  clientId: string;
  projectId?: string;
  type: "contact" | "note";
  data: { name?: string; email?: string; content?: string };
  fromEmail?: string;
  subject?: string;
  senderName?: string;
  createdAt: string;
};

type PendingSuggestionsState = {
  items: PendingSuggestion[];
  setItems: (items: PendingSuggestion[]) => void;
  add: (s: PendingSuggestion) => void;
  remove: (id: string) => void;
};

export const usePendingSuggestionsStore = create<PendingSuggestionsState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),

  add: (s) =>
    set((state) => {
      if (state.items.some((i) => i.id === s.id)) return state;
      return { items: [s, ...state.items] };
    }),

  remove: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
}));

/** Mock data pour preview — IDs préfixés mock- pour éviter les appels serveur. */
export const MOCK_PENDING_SUGGESTIONS: PendingSuggestion[] = [
  {
    id: "mock-contact-1",
    clientId: "mock-client",
    type: "contact",
    data: { name: "Marie Dupont", email: "marie.dupont@exemple.fr" },
    fromEmail: "marie.dupont@exemple.fr",
    subject: "Re: Proposition projet Q1",
    senderName: "Marie",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-contact-2",
    clientId: "mock-client",
    type: "contact",
    data: { name: "Thomas Martin", email: "thomas@forge.io" },
    fromEmail: "thomas@forge.io",
    subject: "Devis site vitrine",
    senderName: "Thomas",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-note-1",
    clientId: "mock-client",
    type: "note",
    data: {
      name: "Échange - Proposition projet Q1",
      content: "**Contexte** : Échange sur le budget et planning.\n**Points clés** : Budget 15k€ validé, livraison mi-mars.\n**Actions** : Envoyer devis signé.",
    },
    fromEmail: "marie.dupont@exemple.fr",
    subject: "Re: Proposition projet Q1",
    senderName: "Marie",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];
