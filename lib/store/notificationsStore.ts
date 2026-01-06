// lib/store/notificationsStore.ts
'use client';

import { create } from 'zustand';
import { Notification } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';
import { apiRequest } from '@/lib/utils/api';

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => Promise<Notification | null>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getUnreadCount: () => number;
}

const normalizeNotification = (notification: Notification): Notification => ({
  ...notification,
  createdAt:
    notification.createdAt instanceof Date
      ? notification.createdAt
      : new Date(notification.createdAt),
});

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  hasLoaded: false,

  loadNotifications: async () => {
    if (get().hasLoaded) return;
    set({ isLoading: true });
    try {
      const data = await apiRequest<Notification[]>('/api/notifications');
      set({ notifications: data.map(normalizeNotification), hasLoaded: true });
    } catch (error) {
      // Silently fail - keep persisted data if API is unavailable
      // This allows the app to work with local data until database is set up
      console.warn('Failed to load notifications from API, using persisted data:', error);
      set({ hasLoaded: true }); // Mark as loaded to prevent retry
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: async (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: notificationData.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: notificationData.createdAt || new Date(),
    };

    const normalized = normalizeNotification(notification);
    set((state) => ({ notifications: [normalized, ...state.notifications] }));

    try {
      const created = await apiRequest<Notification>('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
      const serverNormalized = normalizeNotification(created);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === normalized.id ? serverNormalized : n,
        ),
      }));
      return serverNormalized;
    } catch (error) {
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to add notification'),
        'NotificationsStore.addNotification',
        'high',
      );
      return normalized; // Return local version on error
    }
  },

  markAsRead: async (id) => {
    // Update local state immediately
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));

    try {
      await apiRequest<Notification>(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
    } catch (error) {
      // Revert on error
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: false } : n)),
      }));
      errorHandler.logError(
        error instanceof Error ? error : new Error(`Failed to mark notification ${id} as read`),
        'NotificationsStore.markAsRead',
        'high',
      );
    }
  },

  markAllAsRead: async () => {
    // Update local state immediately
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));

    try {
      await apiRequest<{ updated: number }>('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
    } catch (error) {
      // Revert on error
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: false })),
      }));
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to mark all notifications as read'),
        'NotificationsStore.markAllAsRead',
        'high',
      );
    }
  },

  removeNotification: async (id) => {
    // Remove from local state immediately
    const notificationToRemove = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

    try {
      await apiRequest<{ id: string }>(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Restore on error
      if (notificationToRemove) {
        set((state) => ({ notifications: [...state.notifications, notificationToRemove] }));
      }
      errorHandler.logError(
        error instanceof Error ? error : new Error(`Failed to remove notification ${id}`),
        'NotificationsStore.removeNotification',
        'high',
      );
    }
  },

  clearAll: async () => {
    // Clear local state immediately
    const notificationsToRestore = [...get().notifications];
    set({ notifications: [] });

    try {
      await apiRequest<{ deleted: number }>('/api/notifications', { method: 'DELETE' });
    } catch (error) {
      // Restore on error
      set({ notifications: notificationsToRestore });
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to clear all notifications'),
        'NotificationsStore.clearAll',
        'high',
      );
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
