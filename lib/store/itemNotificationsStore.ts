// lib/store/itemNotificationsStore.ts
// Simple toggle store for item-level notification preferences
// This tracks which items have notifications enabled (bell icon state)
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ItemNotificationsState {
  // Map of itemId -> enabled state
  enabledItems: Record<string, boolean>;

  // Toggle notification for an item
  toggleNotification: (itemId: string) => boolean;

  // Check if notification is enabled for an item
  isNotificationEnabled: (itemId: string) => boolean;

  // Enable notification for an item
  enableNotification: (itemId: string) => void;

  // Disable notification for an item
  disableNotification: (itemId: string) => void;

  // Clear all
  reset: () => void;
}

export const useItemNotificationsStore = create<ItemNotificationsState>()(
  persist(
    (set, get) => ({
      enabledItems: {},

      toggleNotification: (itemId: string) => {
        const current = get().enabledItems[itemId] || false;
        const newState = !current;
        set((state) => ({
          enabledItems: {
            ...state.enabledItems,
            [itemId]: newState,
          },
        }));
        return newState;
      },

      isNotificationEnabled: (itemId: string) => {
        return get().enabledItems[itemId] || false;
      },

      enableNotification: (itemId: string) => {
        set((state) => ({
          enabledItems: {
            ...state.enabledItems,
            [itemId]: true,
          },
        }));
      },

      disableNotification: (itemId: string) => {
        set((state) => ({
          enabledItems: {
            ...state.enabledItems,
            [itemId]: false,
          },
        }));
      },

      reset: () => {
        set({ enabledItems: {} });
      },
    }),
    {
      name: 'item-notifications',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
