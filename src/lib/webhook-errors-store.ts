/**
 * Store pour les erreurs webhook (Resend, agent).
 * Affichées dans la cloche avec style erreur.
 */

import { create } from "zustand";

export type WebhookError = {
  id: string;
  source: string;
  errorMessage: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

type WebhookErrorsState = {
  items: WebhookError[];
  setItems: (items: WebhookError[]) => void;
  add: (e: WebhookError) => void;
  remove: (id: string) => void;
};

export const useWebhookErrorsStore = create<WebhookErrorsState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),

  add: (e) =>
    set((state) => {
      if (state.items.some((i) => i.id === e.id)) return state;
      return { items: [e, ...state.items] };
    }),

  remove: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
}));
