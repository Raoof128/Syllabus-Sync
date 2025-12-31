// lib/store/notificationsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/lib/types';

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) =>
        set((state) => {
          if (state.notifications.some((existing) => existing.id === notification.id)) {
            return state;
          }
          return { notifications: [notification, ...state.notifications] };
        }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'notifications-storage',
      onRehydrateStorage: () => (state) => {
        if (!state?.notifications?.length) return;
        const seen = new Set<string>();
        const deduped = state.notifications.filter((notification) => {
          if (seen.has(notification.id)) return false;
          seen.add(notification.id);
          return true;
        });
        if (deduped.length !== state.notifications.length) {
          state.notifications = deduped;
        }
      },
    }
  )
);
