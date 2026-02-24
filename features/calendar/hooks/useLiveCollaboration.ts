// features/calendar/hooks/useLiveCollaboration.ts
// ============================================================================
// REAL-TIME COLLABORATION HOOK
// ============================================================================
// Provides Supabase Realtime integration for live collaboration:
// 1. postgres_changes - Live database change subscriptions (edits by others)
// 2. broadcast - Peer cursor/selection tracking
// 3. presence - Who is currently viewing the schedule ("Google Docs" effect)
//
// SECURITY NOTES:
// - Supabase Realtime respects RLS when JWT is passed correctly
// - Broadcast channels should use private channels for sensitive data
// - Never trust broadcast payloads from peers without server validation

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useEventsStore } from '@/lib/store/eventsStore';
import { logger } from '@/lib/logger';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  lastSeen: string;
}

interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

interface CollaborationState {
  /** Users currently viewing this schedule */
  activeUsers: ActiveUser[];
  /** Cursor positions of remote peers */
  peerCursors: Map<string, CursorPosition>;
  /** Whether the realtime connection is active */
  isConnected: boolean;
  /** The Supabase Realtime channel (for sending broadcasts) */
  channel: RealtimeChannel | null;
}

// Predefined collaboration colors (MQ brand-adjacent)
const COLLAB_COLORS = [
  '#A6192E', // MQ Red
  '#E87722', // MQ Orange
  '#00B2A9', // Teal
  '#7B2D8E', // Purple
  '#0077C8', // Blue
  '#D4A017', // Gold
  '#2E8B57', // Green
  '#DC143C', // Crimson
];

function getCollabColor(userId: string): string {
  // Deterministic color from user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

// ============================================================================
// HOOK
// ============================================================================

export function useLiveCollaboration(
  scheduleId: string | null,
  userProfile: { id: string; name: string; avatar?: string } | null,
) {
  const [state, setState] = useState<CollaborationState>({
    activeUsers: [],
    peerCursors: new Map(),
    isConnected: false,
    channel: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const loadEvents = useEventsStore((s) => s.loadEvents);

  // Broadcast cursor position to peers
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!channelRef.current || !userProfile) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: userProfile.id,
          x,
          y,
          timestamp: Date.now(),
        },
      });
    },
    [userProfile],
  );

  useEffect(() => {
    if (!scheduleId || !userProfile || !isSupabaseConfigured()) return;

    const supabase = createBrowserClient();
    const channelName = `schedule:${scheduleId}`;

    const room = supabase.channel(channelName, {
      config: {
        presence: { key: userProfile.id },
        broadcast: { self: false }, // Don't receive own broadcasts
      },
    });

    // 1. POSTGRES CHANGES - Live database edits
    room.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `schedule_id=eq.${scheduleId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        logger.info('Realtime event change:', payload.eventType);

        // Refresh events store when a peer makes a change
        // This is simpler than granular patch application and avoids
        // race conditions with the local optimistic store
        loadEvents();
      },
    );

    // 2. BROADCAST - Peer cursor tracking
    room.on('broadcast', { event: 'cursor-move' }, (payload: { payload: CursorPosition }) => {
      const cursor = payload.payload as CursorPosition;
      if (!cursor?.userId) return;

      setState((prev) => {
        const updated = new Map(prev.peerCursors);
        updated.set(cursor.userId, cursor);

        // Clean up stale cursors (older than 10 seconds)
        const now = Date.now();
        for (const [id, pos] of updated) {
          if (now - pos.timestamp > 10_000) {
            updated.delete(id);
          }
        }

        return { ...prev, peerCursors: updated };
      });
    });

    // 3. PRESENCE - Who is online
    room.on('presence', { event: 'sync' }, () => {
      const presenceState = room.presenceState();
      const users: ActiveUser[] = Object.entries(presenceState).flatMap(([_key, presences]) =>
        (presences as Array<{ id: string; name: string; avatar?: string }>).map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          color: getCollabColor(p.id),
          lastSeen: new Date().toISOString(),
        })),
      );

      setState((prev) => ({ ...prev, activeUsers: users }));
    });

    // Subscribe and track presence
    room.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await room.track({
          id: userProfile.id,
          name: userProfile.name,
          avatar: userProfile.avatar,
        });

        setState((prev) => ({ ...prev, isConnected: true, channel: room }));
        channelRef.current = room;
      }
    });

    // Cleanup on unmount
    return () => {
      room.untrack();
      supabase.removeChannel(room);
      channelRef.current = null;
      setState({
        activeUsers: [],
        peerCursors: new Map(),
        isConnected: false,
        channel: null,
      });
    };
  }, [scheduleId, userProfile, loadEvents]);

  return {
    activeUsers: state.activeUsers,
    peerCursors: state.peerCursors,
    isConnected: state.isConnected,
    broadcastCursor,
  };
}
