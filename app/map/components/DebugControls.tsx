import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/mq/badge';
import { Play, Pause, RotateCcw, Settings2, Activity } from 'lucide-react';
import type { NavigationState } from '@/lib/map/realtimeNavigation';

interface DebugControlsProps {
  onSimulate: () => void;
  isNavigating: boolean;
  navState: NavigationState | null;
  locationStatus: string;
  isOffCampus: boolean;
}

export function DebugControls({
  onSimulate,
  isNavigating,
  navState,
  locationStatus,
  isOffCampus,
}: DebugControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState(0);

  // Simple FPS counter
  useEffect(() => {
    if (!isOpen) return;
    let lastTime = performance.now();
    let frames = 0;
    const loop = () => {
      const now = performance.now();
      frames++;
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-24 left-4 z-[1000] bg-white/90 backdrop-blur shadow-md border-mq-border h-8 w-8 p-0"
        onClick={() => setIsOpen(true)}
      >
        <Settings2 className="h-4 w-4 text-mq-content-secondary" />
      </Button>
    );
  }

  return (
    <Card className="absolute top-24 left-4 z-[1000] w-72 bg-white/95 backdrop-blur shadow-xl border-mq-border p-3 text-xs font-mono">
      <div className="flex items-center justify-between mb-3 border-b border-mq-border pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-mq-primary" />
          <span className="font-bold text-mq-content">DevTools</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-mq-background-secondary"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </Button>
      </div>

      <div className="space-y-3">
        {/* Status Monitor */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-mq-background-secondary p-1.5 rounded">
            <div className="text-mq-content-tertiary uppercase">GPS Status</div>
            <div
              className={`font-bold ${locationStatus === 'found' ? 'text-green-600' : 'text-red-500'}`}
            >
              {locationStatus.toUpperCase()}
            </div>
          </div>
          <div className="bg-mq-background-secondary p-1.5 rounded">
            <div className="text-mq-content-tertiary uppercase">On Campus</div>
            <div className={`font-bold ${!isOffCampus ? 'text-green-600' : 'text-red-500'}`}>
              {isOffCampus ? 'NO' : 'YES'}
            </div>
          </div>
          <div className="bg-mq-background-secondary p-1.5 rounded">
            <div className="text-mq-content-tertiary uppercase">FPS</div>
            <div className="font-bold text-mq-content">{fps}</div>
          </div>
          <div className="bg-mq-background-secondary p-1.5 rounded">
            <div className="text-mq-content-tertiary uppercase">Nav State</div>
            <div className="font-bold text-mq-content">{navState?.status || 'IDLE'}</div>
          </div>
        </div>

        {/* Navigation Info */}
        {isNavigating && navState && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
            <div className="flex justify-between mb-1">
              <span>Dist to Turn:</span>
              <span className="font-bold">{navState.distanceToNextInstruction.toFixed(1)}m</span>
            </div>
            <div className="flex justify-between">
              <span>Total Dist:</span>
              <span className="font-bold">{navState.remainingDistance.toFixed(1)}m</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-between h-8 text-xs"
            onClick={onSimulate}
            disabled={!navState?.routeCoordinates.length && !isNavigating}
          >
            <span className="flex items-center gap-2">
              <Play className="h-3 w-3" />
              Simulate Route
            </span>
            {isNavigating && (
              <Badge variant="secondary" className="h-4 px-1">
                Active
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
