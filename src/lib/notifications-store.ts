/**
 * Store pour les notifications d'activité (email, etc.).
 * La cloche affiche un point rouge et un panneau au clic.
 */

import { create } from "zustand";

export type ActivityNotification = {
  id: string;
  clientId: string;
  clientName?: string;
  actionType: string;
  summary: string;
  source: string;
  createdAt: string;
};

const MAX_NOTIFICATIONS = 20;

type NotificationsState = {
  items: ActivityNotification[];
  add: (n: ActivityNotification) => void;
  hydrate: (items: ActivityNotification[]) => void;
  markAllRead: () => void;
  unreadCount: number;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,

  add: (n) =>
    set((s) => {
      const exists = s.items.some((i) => i.id === n.id);
      if (exists) return s;
      const items = [n, ...s.items].slice(0, MAX_NOTIFICATIONS);
      return { items, unreadCount: s.unreadCount + 1 };
    }),

  hydrate: (items) => set({ items: items.slice(0, MAX_NOTIFICATIONS), unreadCount: 0 }),

  markAllRead: () => set({ unreadCount: 0 }),
}));
