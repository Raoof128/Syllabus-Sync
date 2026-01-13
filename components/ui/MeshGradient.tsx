// components/ui/MeshGradient.tsx
// ============================================================================
// MESH GRADIENT BACKGROUND
// ============================================================================
// Animated gradient background with drifting blobs that create movement
// behind liquid glass surfaces. Uses Framer Motion for smooth, organic
// animations that respect user preferences for reduced m.
//
// USAGE:
// Add <MeshGradient /> to your root layout (client-layout.tsx) as the
// first child, positioned behind all other content.
//
// PERFORMANCE:
// - Uses will-change: transform for GPU compositing
// - Respects prefers-reduced-motion (static gradients)
// - Low-frequency animations (60s+ duration) for minimal CPU impact
// ============================================================================
'use client';

import { memo, useSyncExternalStore } from 'react';
import { LazyMotion, m, domAnimation, useReducedMotion } from 'framer-motion';

// Helper for detecting client-side rendering without setState in effect
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * MeshGradient Component
 *
 * Creates an animated background with four gradient blobs:
 * - Navy blob (top-left): MQ brand color
 * - Red blob (bottom-right): MQ accent
 * - Charcoal blob (center): Neutral depth
 * - Gold blob (subtle accent): Premium touch
 *
 * Each blob drifts slowly with different timing to create
 * organic, non-repeating movement patterns.
 */
const MeshGradient = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  // Use useSyncExternalStore to detect client without setState in effect
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Static fallback for SSR and reduced motion preference
  if (!isClient || prefersReducedMotion) {
    return (
      <div className="mq-mesh-gradient" aria-hidden="true">
        <div className="mq-mesh-blob mq-mesh-blob-navy" />
        <div className="mq-mesh-blob mq-mesh-blob-red" />
        <div className="mq-mesh-blob mq-mesh-blob-charcoal" />
        <div className="mq-mesh-blob mq-mesh-blob-gold" />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="mq-mesh-gradient" aria-hidden="true">
        {/* Navy Blob - Top Left */}
        <m.div
          className="mq-mesh-blob mq-mesh-blob-navy"
          animate={{
            x: [0, 50, 20, -30, 0],
            y: [0, 30, -20, 40, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
            rotate: [0, 45, 0, -45, 0],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Red Blob - Bottom Right */}
        <m.div
          className="mq-mesh-blob mq-mesh-blob-red"
          animate={{
            x: [0, -40, 30, -20, 0],
            y: [0, -30, 20, -40, 0],
            scale: [1, 0.95, 1.1, 1, 1],
            rotate: [0, -30, 10, 30, 0],
          }}
          transition={{
            duration: 55,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Charcoal Blob - Center */}
        <m.div
          className="mq-mesh-blob mq-mesh-blob-charcoal"
          animate={{
            x: [0, 30, -40, 20, 0],
            y: [0, -40, 30, -20, 0],
            scale: [1, 1.05, 0.9, 1.08, 1],
            rotate: [0, 20, -20, 10, 0],
          }}
          transition={{
            duration: 65,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Gold Blob - Subtle Accent */}
        <m.div
          className="mq-mesh-blob mq-mesh-blob-gold"
          animate={{
            x: [0, 60, -30, 40, 0],
            y: [0, 20, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1.1, 1],
            opacity: [0.3, 0.5, 0.25, 0.45, 0.3],
            rotate: [0, -60, 30, -30, 0],
          }}
          transition={{
            duration: 80,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </LazyMotion>
  );
});

MeshGradient.displayName = 'MeshGradient';

export default MeshGradient;
