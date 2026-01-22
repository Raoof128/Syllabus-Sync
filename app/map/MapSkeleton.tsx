'use client';

import { LazyMotion, m, domAnimation } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

/**
 * MapLoadingSkeleton - Animated skeleton loader for map component
 * Shows a pulsing map placeholder with animated "dropping" pins
 */
export function MapLoadingSkeleton() {
  const { t } = useTranslation();
  // Animated pin positions (relative percentages)
  const pinPositions = [
    { x: 25, y: 30, delay: 0 },
    { x: 55, y: 45, delay: 0.15 },
    { x: 40, y: 60, delay: 0.3 },
    { x: 70, y: 35, delay: 0.45 },
    { x: 30, y: 70, delay: 0.6 },
    { x: 60, y: 55, delay: 0.75 },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="relative w-full h-full bg-mq-background-secondary overflow-hidden"
        role="status"
        aria-label={t('loadingMap')}
      >
        {/* Pulsing background gradient */}
        <m.div
          className="absolute inset-0 bg-gradient-to-br from-mq-background-secondary via-mq-background to-mq-background-secondary"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Grid lines to simulate map */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              linear-gradient(to right, var(--mq-content-tertiary) 1px, transparent 1px),
              linear-gradient(to bottom, var(--mq-content-tertiary) 1px, transparent 1px)
            `,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Animated pins dropping in */}
        {pinPositions.map((pin, index) => (
          <m.div
            key={index}
            className="absolute"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            initial={{ y: -50, opacity: 0, scale: 0 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              delay: pin.delay,
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
            }}
          >
            <m.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                delay: pin.delay + 0.5,
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <MapPin className="h-6 w-6 text-mq-primary/60" />
            </m.div>
            {/* Pin shadow */}
            <m.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/20 rounded-full"
              animate={{
                scale: [1, 0.8, 1],
                opacity: [0.3, 0.15, 0.3],
              }}
              transition={{
                delay: pin.delay + 0.5,
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </m.div>
        ))}

        {/* Center loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <m.div
            className="flex flex-col items-center gap-3 bg-mq-card-background px-6 py-4 rounded-mq-lg shadow-mq"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <m.div
              className="w-8 h-8 border-3 border-mq-primary/30 border-t-mq-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <span className="text-mq-sm text-mq-content-secondary font-medium">
              Loading campus map...
            </span>
          </m.div>
        </div>

        {/* Screen reader text */}
        <span className="sr-only">Loading interactive campus map, please wait...</span>
      </div>
    </LazyMotion>
  );
}

/**
 * BuildingListSkeleton - Skeleton for the buildings sidebar list
 * Used when filtering/searching buildings
 */
export function BuildingListSkeleton({ count = 8 }: { count?: number }) {
  const { t } = useTranslation();
  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-3" role="status" aria-label={t('loadingBuildings')}>
        {Array.from({ length: count }).map((_, index) => (
          <m.div
            key={index}
            className="p-3 rounded-mq-lg bg-mq-background-secondary border border-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <m.div
                className="w-8 h-8 rounded-mq bg-mq-background"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="flex-1 space-y-2">
                {/* Title placeholder */}
                <m.div
                  className="h-4 w-16 rounded bg-mq-background"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                />
                {/* Description placeholder */}
                <m.div
                  className="h-3 w-32 rounded bg-mq-background"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
              </div>
              {/* Badge placeholder */}
              <m.div
                className="h-5 w-14 rounded-full bg-mq-background"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          </m.div>
        ))}
        <span className="sr-only">Loading building list...</span>
      </div>
    </LazyMotion>
  );
}

/**
 * CategoryFilterSkeleton - Skeleton for category filter pills
 */
export function CategoryFilterSkeleton() {
  const { t } = useTranslation();
  // Pre-computed widths for deterministic rendering
  const widths = [70, 85, 65, 90, 75, 80, 72, 88, 68];

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-wrap gap-2" role="status" aria-label={t('loadingFilters')}>
        {widths.map((width, index) => (
          <m.div
            key={index}
            className="h-8 rounded-full bg-mq-background-secondary"
            style={{ width: `${width}px` }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.05 }}
          />
        ))}
        <span className="sr-only">Loading category filters...</span>
      </div>
    </LazyMotion>
  );
}

export default MapLoadingSkeleton;
