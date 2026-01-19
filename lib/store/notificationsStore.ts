// lib/store/notificationsStore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';
import { apiRequest } from '@/lib/utils/api';
import { sampleNotifications } from '@/data/sampleNotifications';

// Maximum number of notifications to keep in state
const MAX_NOTIFICATIONS = 100;

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadNotifications: () => Promise<void>;
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'> & { id?: string; createdAt?: Date },
  ) => Promise<Notification | null>;
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

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      hasLoaded: false,

      loadNotifications: async () => {
        if (get().hasLoaded) return;
        set({ isLoading: true });
        try {
          const data = await apiRequest<Notification[]>('/api/notifications', { noRetry: true });
          // Limit notifications and sort by date (newest first)
          const normalized = data
            .map(normalizeNotification)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, MAX_NOTIFICATIONS);

          // If no notifications from API, seed with sample data for demo
          if (normalized.length === 0) {
            const seededNotifications = sampleNotifications
              .map(normalizeNotification)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, MAX_NOTIFICATIONS);
            set({ notifications: seededNotifications, hasLoaded: true });
          } else {
            set({ notifications: normalized, hasLoaded: true });
          }
        } catch (error) {
          // Silently fail for auth errors (401) - expected when not logged in
          // For other errors, seed with sample data if no persisted data exists
          const isAuthError =
            error instanceof Error &&
            (error.message.includes('401') ||
              error.message.includes('authentication') ||
              error.message.includes('Unauthorized'));

          if (!isAuthError) {
            console.warn('Failed to load notifications from API, using sample data:', error);
          }

          // If no persisted notifications, seed with sample data for demo
          const currentNotifications = get().notifications;
          if (currentNotifications.length === 0) {
            const seededNotifications = sampleNotifications
              .map(normalizeNotification)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, MAX_NOTIFICATIONS);
            set({ notifications: seededNotifications, hasLoaded: true });
          } else {
            set({ hasLoaded: true }); // Mark as loaded to prevent retry
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addNotification: async (notificationData) => {
        // Small helper to validate UUID format
        const isValidUUID = (value?: string) =>
          typeof value === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

        // Generate temporary ID for local state
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const notification: Notification = {
          ...notificationData,
          id: notificationData.id || tempId,
          createdAt: notificationData.createdAt || new Date(),
        };

        const normalized = normalizeNotification(notification);
        const localNotification = { ...normalized, id: tempId };

        // Add to front and limit total count
        set((state) => ({
          notifications: [localNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
        }));

        try {
          // Prepare payload for API - enforce schema constraints
          const apiPayload: Partial<Notification> = { ...normalized };

          // Drop id unless it's a valid UUID (temp ids and non-UUIDs are removed)
          if (apiPayload.id && !isValidUUID(apiPayload.id)) {
            delete apiPayload.id;
          }

          // createdAt in schema is z.date(); client JSON sends strings. Let API set it.
          delete apiPayload.createdAt;

          // Normalize link to absolute URL if possible; remove if invalid
          if (apiPayload.link) {
            try {
              const base = typeof window !== 'undefined' ? window.location.origin : undefined;
              apiPayload.link = new URL(apiPayload.link, base).toString();
            } catch {
              delete apiPayload.link;
            }
          }

          // relatedId must be UUID if provided
          if (apiPayload.relatedId && !isValidUUID(apiPayload.relatedId)) {
            delete apiPayload.relatedId;
          }

          const created = await apiRequest<Notification>('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload),
          });
          const serverNormalized = normalizeNotification(created);
          set((state) => ({
            notifications: state.notifications.map((n) => (n.id === tempId ? serverNormalized : n)),
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
        // Helper to validate UUID format
        const isValidUUID = (value: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

        // Update local state immediately
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));

        // Skip API call for sample/local notifications (non-UUID or temp IDs)
        if (!isValidUUID(id) || id.startsWith('temp-')) {
          return;
        }

        try {
          await apiRequest<Notification>(`/api/notifications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          });
        } catch (error) {
          // For 404 errors (notification doesn't exist in DB), just keep the local state change
          // This can happen with sample notifications that have UUID-like IDs but aren't in DB
          const is404 = error instanceof Error && error.message.includes('404');
          if (is404) {
            return; // Keep the local read state, don't revert
          }

          // Revert on other errors
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: false } : n,
            ),
          }));
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to mark notification ${id} as read`),
            'NotificationsStore.markAsRead',
            'high',
          );
        }
      },

      markAllAsRead: async () => {
        // Store original read states for rollback
        const originalReadStates = new Map(get().notifications.map((n) => [n.id, n.read]));

        // Update local state immediately
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));

        try {
          await apiRequest<{ updated: number }>('/api/notifications/mark-all-read', {
            method: 'PUT',
          });
        } catch (error) {
          // For 404/500 errors with sample data, keep local state (sample notifications aren't in DB)
          const isExpectedError =
            error instanceof Error &&
            (error.message.includes('404') || error.message.includes('500'));
          if (isExpectedError) {
            return; // Keep the local read states
          }

          // Revert to original read states on other errors
          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              read: originalReadStates.get(n.id) ?? n.read,
            })),
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
    }),
    {
      name: 'notifications-storage',
      version: 1,
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    },
  ),
);
