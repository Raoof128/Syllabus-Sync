// components/sync/SyncConflictDialog.tsx
// ============================================================================
// SYNC CONFLICT RESOLUTION DIALOG
// ============================================================================
// Shows a modal when offline sync detects version conflicts. Lets users
// compare their local (offline) changes with the server version and choose
// which to keep. Reads directly from useSyncStore — no props needed.

'use client';

import { useCallback } from 'react';
import { AlertTriangle, Cloud, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useSyncStore, type SyncConflict } from '@/lib/store/offlineSyncStore';

function ConflictCard({ conflict }: { conflict: SyncConflict }) {
  const { t } = useTypedTranslation();
  const resolveConflict = useSyncStore((s) => s.resolveConflict);

  const clientData = conflict.action.data ?? {};
  const serverData = conflict.serverData ?? {};

  // Get display-friendly field names (shared between client/server)
  const allKeys = Array.from(
    new Set([...Object.keys(clientData), ...Object.keys(serverData)]),
  ).filter((k) => !k.startsWith('_')); // hide internal flags like _forceVersion

  const handleKeepClient = useCallback(() => {
    resolveConflict(conflict.action.id, 'client');
  }, [resolveConflict, conflict.action.id]);

  const handleKeepServer = useCallback(() => {
    resolveConflict(conflict.action.id, 'server');
  }, [resolveConflict, conflict.action.id]);

  return (
    <div className="rounded-xl border border-mq-border bg-mq-card-background p-4">
      {/* Conflict header */}
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold text-mq-content">
          {conflict.action.table} &middot; {conflict.action.type}
        </span>
        <span className="ml-auto text-xs text-mq-content-secondary">
          v{conflict.action.clientVersion} &rarr; v{conflict.serverVersion}
        </span>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Client version */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
            <Smartphone className="h-3.5 w-3.5" />
            {t('yourVersion')}
          </div>
          <dl className="space-y-1.5">
            {allKeys.map((key) => (
              <div key={key}>
                <dt className="text-[10px] uppercase tracking-wider text-mq-content-secondary">
                  {key}
                </dt>
                <dd
                  className="text-xs text-mq-content truncate"
                  title={String(clientData[key] ?? '—')}
                >
                  {String(clientData[key] ?? '—')}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Server version */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Cloud className="h-3.5 w-3.5" />
            {t('serverVersion')}
          </div>
          <dl className="space-y-1.5">
            {allKeys.map((key) => (
              <div key={key}>
                <dt className="text-[10px] uppercase tracking-wider text-mq-content-secondary">
                  {key}
                </dt>
                <dd
                  className="text-xs text-mq-content truncate"
                  title={String(serverData[key] ?? '—')}
                >
                  {String(serverData[key] ?? '—')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Resolution buttons */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" onClick={handleKeepServer} className="gap-1.5">
          <Cloud className="h-3.5 w-3.5" />
          {t('keepServerVersion')}
        </Button>
        <Button
          size="sm"
          onClick={handleKeepClient}
          className="gap-1.5 bg-mq-primary text-white hover:bg-mq-primary/90"
        >
          <Smartphone className="h-3.5 w-3.5" />
          {t('keepMyChanges')}
        </Button>
      </div>
    </div>
  );
}

export default function SyncConflictDialog() {
  const { t } = useTypedTranslation();
  const conflicts = useSyncStore((s) => s.conflicts);
  const clearConflicts = useSyncStore((s) => s.clearConflicts);

  // Only unresolved conflicts
  const unresolvedConflicts = conflicts.filter((c) => !c.resolvedAt);

  if (unresolvedConflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-mq-border bg-mq-background shadow-xl">
        {/* Dialog header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-mq-border bg-mq-background px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-mq-content">{t('syncConflict')}</h2>
            <p className="text-sm text-mq-content-secondary">{t('syncConflictDesc')}</p>
          </div>
          <button
            onClick={clearConflicts}
            className="rounded-lg p-2 text-mq-content-secondary transition-colors hover:bg-mq-hover-background hover:text-mq-content"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conflict list */}
        <div className="space-y-4 p-5">
          {unresolvedConflicts.map((conflict) => (
            <ConflictCard key={conflict.action.id} conflict={conflict} />
          ))}
        </div>
      </div>
    </div>
  );
}
