// lib/store/notificationsStore.ts
'use client';

import { create } from 'zustand';
import { Notification } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';
import { apiRequest } from '@/lib/utils/api';

// Maximum number of notifications to keep in state
const MAX_NOTIFICATIONS = 100;
const STALE_MS = 60 * 1000; // 1 minute revalidation window

type LoadOptions = { force?: boolean };

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  hasLoaded: boolean;
  lastLoadedAt: number | null;
  loadNotifications: (options?: LoadOptions) => Promise<void>;
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'> & { id?: string; createdAt?: Date },
  ) => Promise<Notification | null>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getUnreadCount: () => number;
  clearNotifications: () => void;
}

const normalizeNotification = (notification: Notification): Notification => ({
  ...notification,
  createdAt:
    notification.createdAt instanceof Date
      ? notification.createdAt
      : new Date(notification.createdAt),
});

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  isLoading: false,
  hasLoaded: false,
  lastLoadedAt: null,

  loadNotifications: async (options?: LoadOptions) => {
    const { force = false } = options ?? {};
    const now = Date.now();

    const lastLoadedAt = get().lastLoadedAt;
    if (!force && lastLoadedAt !== null && now - lastLoadedAt < STALE_MS) {
      return;
    }

    set({ isLoading: true });
    try {
      const data = await apiRequest<Notification[]>('/api/notifications', { noRetry: true });
      const normalized = data
        .map(normalizeNotification)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_NOTIFICATIONS);

      set({ notifications: normalized, hasLoaded: true, lastLoadedAt: Date.now() });
    } catch (error) {
      const isAuthError =
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('authentication') ||
          error.message.includes('Unauthorized'));

      if (isAuthError) {
        set({ notifications: [], hasLoaded: true, lastLoadedAt: Date.now() });
        // Redirect to login if session is invalid
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      } else {
        console.warn('Failed to load notifications from API:', error);
        set({ hasLoaded: true, lastLoadedAt: Date.now() });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: async (notificationData) => {
    const isValidUUID = (value?: string) =>
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification: Notification = {
      ...notificationData,
      id: notificationData.id || tempId,
      createdAt: notificationData.createdAt || new Date(),
    };

    const normalized = normalizeNotification(notification);
    const localNotification = { ...normalized, id: tempId };

    set((state) => ({
      notifications: [localNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));

    try {
      const apiPayload: Partial<Notification> = { ...normalized };

      if (apiPayload.id && !isValidUUID(apiPayload.id)) {
        delete apiPayload.id;
      }

      delete apiPayload.createdAt;

      if (apiPayload.link) {
        try {
          const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
          // Handle relative URLs by prepending base
          const linkUrl = apiPayload.link.startsWith('/')
            ? new URL(apiPayload.link, base).toString()
            : new URL(apiPayload.link).toString();
          apiPayload.link = linkUrl;
        } catch {
          // If URL parsing fails, remove the invalid link
          delete apiPayload.link;
        }
      }

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
      // Handle 409 Conflict (notification already exists) gracefully
      const is409 = error instanceof Error && error.message.includes('409');
      if (is409) {
        // Remove the optimistic notification since it already exists
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== tempId),
        }));
        // Reload notifications to get the existing one
        get().loadNotifications({ force: true });
        return null;
      }

      // For other errors, log and keep the local notification
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to add notification'),
        'NotificationsStore.addNotification',
        'medium',
      );
      return normalized;
    }
  },

  markAsRead: async (id) => {
    const isValidUUID = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));

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
      const is404 = error instanceof Error && error.message.includes('404');
      if (is404) {
        return;
      }

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
    const originalReadStates = new Map(get().notifications.map((n) => [n.id, n.read]));

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));

    try {
      await apiRequest<{ updated: number }>('/api/notifications/mark-all-read', { method: 'PUT' });
    } catch (error) {
      const isExpectedError =
        error instanceof Error && (error.message.includes('404') || error.message.includes('500'));
      if (isExpectedError) {
        return;
      }

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
    const notificationToRemove = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

    try {
      await apiRequest<{ id: string }>(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
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
    const notificationsToRestore = [...get().notifications];
    set({ notifications: [], isLoading: true });

    try {
      await apiRequest<{ deleted: number }>('/api/notifications', { method: 'DELETE' });
      set({ notifications: [], isLoading: false });
    } catch (error) {
      set({ notifications: notificationsToRestore, isLoading: false });
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

  clearNotifications: () => {
    set({ notifications: [], hasLoaded: false, isLoading: false, lastLoadedAt: null });
  },
}));
