import { useMemo } from 'react';
import { mapOverlayById, type MapOverlayId } from '@/features/map/lib/mapOverlays';
import type { ReactLeafletModule } from '@/features/map/hooks/useLeafletLoader';

interface MapOverlaysProps {
  reactLeafletModule: ReactLeafletModule;
  activeOverlays: MapOverlayId[];
  overlaysReady: boolean;
}

/**
 * Declarative overlay renderer.
 * Renders active overlays as react-leaflet ImageOverlay components inside a
 * dedicated Pane with pointer-events disabled so overlays never steal clicks.
 *
 * The Pane is always mounted (when overlaysReady) to avoid Leaflet stale-pane
 * issues on remount. Only the ImageOverlay children are conditional.
 */
export function MapOverlays({
  reactLeafletModule,
  activeOverlays,
  overlaysReady,
}: MapOverlaysProps) {
  const { ImageOverlay, Pane } = reactLeafletModule;

  // Only render configs that are active AND in the registry
  const activeConfigs = useMemo(
    () =>
      activeOverlays
        .map((id) => mapOverlayById.get(id))
        .filter((cfg): cfg is NonNullable<typeof cfg> => cfg != null),
    [activeOverlays],
  );

  if (!overlaysReady) return null;

  return (
    <Pane name="campus-overlays" style={{ zIndex: 450, pointerEvents: 'none' }}>
      {activeConfigs.map((cfg) => (
        <ImageOverlay
          key={cfg.id}
          url={cfg.url}
          bounds={cfg.bounds}
          opacity={cfg.opacity}
          zIndex={cfg.zIndex}
          interactive={false}
        />
      ))}
    </Pane>
  );
}
