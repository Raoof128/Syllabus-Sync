// lib/store/offlineSyncStore.ts
// ============================================================================
// OFFLINE SYNC ENGINE - IndexedDB-backed sync queue for offline-first support
// ============================================================================
// Uses IndexedDB (via idb-keyval) instead of localStorage to avoid:
// - Main-thread blocking on large datasets
// - 5MB storage limit
// - Synchronous API performance issues

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

// ============================================================================
// CUSTOM INDEXEDDB STORAGE ADAPTER FOR ZUSTAND
// ============================================================================
// Zustand v5 persist expects a getStorage() that returns a Storage-like object.
// We wrap idb-keyval to match the Web Storage API (getItem/setItem/removeItem).

// Async storage wrapper compatible with Zustand v5 createJSONStorage
function createIDBStorage() {
  return createJSONStorage<unknown>(() => ({
    getItem: async (name: string): Promise<string | null> => {
      try {
        return (await idbGet(name)) ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        await idbSet(name, value);
      } catch {
        // Silently fail - offline data lost but app still works
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await idbDel(name);
      } catch {
        // Silently fail
      }
    },
  }));
}

// ============================================================================
// TYPES
// ============================================================================

export type SyncActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncAction {
  /** Unique ID for this sync action */
  id: string;
  /** Type of mutation */
  type: SyncActionType;
  /** Target table (events, deadlines, todos, etc.) */
  table: string;
  /** Record ID being mutated */
  recordId: string;
  /** The data payload (for CREATE/UPDATE) */
  data: Record<string, unknown> | null;
  /** Client-side version number at time of mutation */
  clientVersion: number;
  /** Timestamp when the action was queued */
  queuedAt: string;
  /** Number of sync attempts so far */
  attempts: number;
  /** Last error message if sync failed */
  lastError?: string;
}

export interface SyncConflict {
  action: SyncAction;
  serverVersion: number;
  serverData: Record<string, unknown>;
  resolvedAt?: string;
  resolution?: 'client' | 'server';
}

interface SyncState {
  /** Queue of pending offline mutations */
  queue: SyncAction[];
  /** Unresolved conflicts requiring user decision */
  conflicts: SyncConflict[];
  /** Whether the sync engine is currently processing */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncAt: string | null;

  // Actions
  enqueueAction: (
    type: SyncActionType,
    table: string,
    recordId: string,
    data: Record<string, unknown> | null,
    clientVersion?: number,
  ) => void;
  processQueue: () => Promise<void>;
  resolveConflict: (actionId: string, resolution: 'client' | 'server') => void;
  clearQueue: () => void;
  clearConflicts: () => void;
  reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTEMPTS = 5;
const SYNC_API_URL = '/api/sync';

// ============================================================================
// STORE
// ============================================================================

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queue: [],
      conflicts: [],
      isSyncing: false,
      lastSyncAt: null,

      enqueueAction: (type, table, recordId, data, clientVersion = 1) => {
        const action: SyncAction = {
          id: uuidv4(),
          type,
          table,
          recordId,
          data,
          clientVersion,
          queuedAt: new Date().toISOString(),
          attempts: 0,
        };

        set((state) => {
          // Deduplicate: if there's already a pending action for the same record,
          // merge or replace it (last-write-wins locally)
          const existingIdx = state.queue.findIndex(
            (a) => a.table === table && a.recordId === recordId,
          );

          if (existingIdx >= 0) {
            const updated = [...state.queue];
            const existing = updated[existingIdx];

            // If existing is CREATE and new is UPDATE, keep as CREATE with merged data
            if (existing.type === 'CREATE' && type === 'UPDATE') {
              updated[existingIdx] = {
                ...existing,
                data: { ...existing.data, ...data },
                queuedAt: action.queuedAt,
              };
              return { queue: updated };
            }

            // If new action is DELETE, it supersedes everything
            if (type === 'DELETE') {
              // If record was created offline and never synced, just remove from queue
              if (existing.type === 'CREATE') {
                return { queue: state.queue.filter((_, i) => i !== existingIdx) };
              }
              updated[existingIdx] = action;
              return { queue: updated };
            }

            // Otherwise replace with latest
            updated[existingIdx] = action;
            return { queue: updated };
          }

          return { queue: [...state.queue, action] };
        });
      },

      processQueue: async () => {
        const { queue, isSyncing } = get();
        if (!queue.length || isSyncing || !navigator.onLine) return;

        set({ isSyncing: true });

        const remainingActions: SyncAction[] = [];
        const newConflicts: SyncConflict[] = [];

        for (const action of queue) {
          if (action.attempts >= MAX_ATTEMPTS) {
            // Too many failures - move to dead letter
            logger.error(`Sync action ${action.id} exceeded max attempts, dropping`, action);
            continue;
          }

          try {
            const response = await fetch(SYNC_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: action.type,
                table: action.table,
                recordId: action.recordId,
                data: action.data,
                clientVersion: action.clientVersion,
              }),
            });

            if (response.ok) {
              // Success - action synced
              continue;
            }

            if (response.status === 409) {
              // Conflict - server has a newer version
              const conflictData = await response.json();
              newConflicts.push({
                action,
                serverVersion: conflictData.serverVersion,
                serverData: conflictData.serverData,
              });
              continue;
            }

            // Other error - retry later
            remainingActions.push({
              ...action,
              attempts: action.attempts + 1,
              lastError: `HTTP ${response.status}`,
            });
          } catch (error) {
            // Network error - keep in queue for retry
            remainingActions.push({
              ...action,
              attempts: action.attempts + 1,
              lastError: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        set((state) => ({
          queue: remainingActions,
          conflicts: [...state.conflicts, ...newConflicts],
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
        }));
      },

      resolveConflict: (actionId, resolution) => {
        set((state) => ({
          conflicts: state.conflicts.map((c) =>
            c.action.id === actionId
              ? { ...c, resolvedAt: new Date().toISOString(), resolution }
              : c,
          ),
        }));

        // If user chose client version, re-enqueue the action with force flag
        const conflict = get().conflicts.find((c) => c.action.id === actionId);
        if (conflict && resolution === 'client') {
          get().enqueueAction(
            conflict.action.type,
            conflict.action.table,
            conflict.action.recordId,
            { ...conflict.action.data, _forceVersion: true } as Record<string, unknown>,
            conflict.serverVersion, // Use server's version so it passes the check
          );
        }

        // Remove resolved conflicts
        set((state) => ({
          conflicts: state.conflicts.filter((c) => !c.resolvedAt),
        }));
      },

      clearQueue: () => set({ queue: [] }),
      clearConflicts: () => set({ conflicts: [] }),
      reset: () => set({ queue: [], conflicts: [], isSyncing: false, lastSyncAt: null }),
    }),
    {
      name: 'syllabus-sync-queue',
      storage: createIDBStorage(),
    },
  ),
);

// ============================================================================
// ONLINE/OFFLINE LISTENER - Auto-process queue when coming back online
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Small delay to ensure network is stable
    setTimeout(() => {
      useSyncStore.getState().processQueue();
    }, 1000);
  });
}
