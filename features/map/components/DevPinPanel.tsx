'use client';

/**
 * DevPinPanel — Dev-only floating panel to drag-reposition building pins on
 * the campus map and save the new pixel coordinates back to buildings.ts.
 *
 * Renders null in production (NODE_ENV check). Only shown when campus view
 * is active and the developer toggles the panel open via the wrench button.
 */

import { Wrench, X, Save, Check, Loader2 } from 'lucide-react';
import { buildings } from '@/features/map/lib/buildings';

interface Props {
  /** Currently selected building id for editing, or null */
  devBuildingId: string | null;
  /** New pixel position after drag [x, y], or null if not dragged yet */
  devPendingPos: [number, number] | null;
  isSaving: boolean;
  saved: boolean;
  onBuildingSelect: (id: string | null) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function DevPinPanel({
  devBuildingId,
  devPendingPos,
  isSaving,
  saved,
  onBuildingSelect,
  onSave,
  onClose,
}: Props) {
  // Hard guard — never render in production
  if (process.env.NODE_ENV !== 'development') return null;

  const selectedBuilding = buildings.find((b) => b.id === devBuildingId) ?? null;
  const currentPos = selectedBuilding?.position ?? null;

  const deltaX = devPendingPos && currentPos ? devPendingPos[0] - currentPos[0] : null;
  const deltaY = devPendingPos && currentPos ? devPendingPos[1] - currentPos[1] : null;

  return (
    <div className="absolute top-14 right-3 z-[2000] w-72 overflow-hidden rounded-xl border-2 border-orange-400/60 bg-white/97 shadow-2xl backdrop-blur-sm dark:border-orange-600/50 dark:bg-gray-950/97">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-200/80 bg-orange-50/80 px-3 py-2 dark:border-orange-800/60 dark:bg-orange-950/40">
        <div className="flex items-center gap-2">
          <Wrench size={13} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
            Dev Pin Editor
          </span>
          <span className="rounded bg-orange-200/80 px-1.5 py-px font-mono text-[10px] font-bold text-orange-800 dark:bg-orange-900/60 dark:text-orange-200">
            DEV
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-orange-100 hover:text-foreground dark:hover:bg-orange-900/40"
          aria-label="Close dev panel"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 p-3">
        {/* Building selector */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Building
          </label>
          <select
            value={devBuildingId ?? ''}
            onChange={(e) => onBuildingSelect(e.target.value || null)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">— select a building —</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} — {b.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBuilding && currentPos && (
          <>
            {/* Current saved position */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs">
              <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Saved position
              </p>
              <p className="font-bold text-foreground">
                [{currentPos[0]}, {currentPos[1]}]
              </p>
            </div>

            {/* Drag instruction / new position */}
            {!devPendingPos ? (
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                Drag the orange pin on the map to reposition it, then save.
              </p>
            ) : (
              <div className="rounded-lg border border-orange-300/70 bg-orange-50/80 px-3 py-2 font-mono text-xs dark:border-orange-700/60 dark:bg-orange-950/60">
                <p className="mb-0.5 text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  New position
                </p>
                <p className="font-bold text-foreground">
                  [{devPendingPos[0]}, {devPendingPos[1]}]
                </p>
                {deltaX !== null && deltaY !== null && (
                  <p className="mt-0.5 text-[10px] text-orange-500/80">
                    Δx {deltaX >= 0 ? '+' : ''}
                    {deltaX} &nbsp; Δy {deltaY >= 0 ? '+' : ''}
                    {deltaY}
                  </p>
                )}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={onSave}
              disabled={!devPendingPos || isSaving}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving…
                </>
              ) : saved ? (
                <>
                  <Check size={13} /> Saved!
                </>
              ) : (
                <>
                  <Save size={13} /> Save to buildings.ts
                </>
              )}
            </button>

            {saved && (
              <p className="text-center text-[10px] text-green-600 dark:text-green-400">
                ✓ File updated. Next.js hot-reload applies the change automatically.
              </p>
            )}
          </>
        )}

        {/* Usage notes */}
        <div className="rounded-lg border border-dashed border-orange-300/50 px-2.5 py-2 text-[10px] leading-relaxed text-muted-foreground dark:border-orange-700/40">
          <strong className="text-orange-600 dark:text-orange-400">Tip:</strong> Position is stored
          as image pixels [x, y]. The map applies a +{'{'}80{'}'} px X-offset when rendering, so the
          saved value is 80 less than the visual CRS lng.
        </div>
      </div>
    </div>
  );
}
