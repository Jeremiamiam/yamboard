/**
 * Store pour les confirmations client en attente (agent a un doute : Brutos = BRUTUS ?).
 */
import { create } from "zustand";

export type ClientConfirmation = {
  id: string;
  mentionedName: string;
  possibleMatchClientId?: string;
  possibleMatchName?: string;
  fromEmail?: string;
  subject?: string;
  createdAt: string;
};

type ClientConfirmationsState = {
  items: ClientConfirmation[];
  setItems: (items: ClientConfirmation[]) => void;
  add: (c: ClientConfirmation) => void;
  remove: (id: string) => void;
};

export const useClientConfirmationsStore = create<ClientConfirmationsState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),

  add: (c) =>
    set((state) => {
      if (state.items.some((i) => i.id === c.id)) return state;
      return { items: [c, ...state.items] };
    }),

  remove: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
}));
