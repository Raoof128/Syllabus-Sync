'use client';

import React, { useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * If true, applies the "liquid enhanced" glass effect classes
   */
  isLiquidEnhanced?: boolean;
}

// ============================================================================
// REDUCED MOTION DETECTION
// ============================================================================

const subscribeToReducedMotion = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getReducedMotionServerSnapshot = () => false;

/**
 * MagicCard Component
 *
 * A premium card container that implements a "mouse-following" glow effect.
 * It tracks mouse movement relative to the card and updates CSS variables
 * (--mouse-x, --mouse-y) which drive a radial gradient background in magic-card.css.
 *
 * Features:
 * - Red border glow that follows the cursor
 * - Subtle surface spotlight effect
 * - Compatible with "Liquid Glass" system via isLiquidEnhanced prop
 * - Respects prefers-reduced-motion for accessibility
 */
export const MagicCard = ({
  children,
  className,
  isLiquidEnhanced = true,
  onMouseMove,
  onMouseLeave,
  ...props
}: MagicCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  // Check for reduced motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Skip mouse tracking if user prefers reduced motion
      if (prefersReducedMotion || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPosition({ x, y });
      setOpacity(1);

      // Call parent handler if provided
      onMouseMove?.(e);
    },
    [onMouseMove, prefersReducedMotion],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Still call parent handler even in reduced motion
      onMouseLeave?.(e);

      // Skip opacity animation if user prefers reduced motion
      if (prefersReducedMotion) return;

      setOpacity(0);
    },
    [onMouseLeave, prefersReducedMotion],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- This div tracks mouse for visual effects only, not interactive
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'mq-magic-card mouse-glow-card relative group',
        isLiquidEnhanced && 'mq-liquid-enhanced',
        // Disable mouse glow in reduced motion
        prefersReducedMotion && 'reduce-motion',
        className,
      )}
      style={
        prefersReducedMotion
          ? undefined
          : ({
              '--mouse-x': `${position.x}px`,
              '--mouse-y': `${position.y}px`,
              '--glow-opacity': opacity,
            } as React.CSSProperties)
      }
      {...props}
      aria-hidden={prefersReducedMotion ? 'false' : undefined}
    >
      {/* 
        Note: The glow effect is handled via CSS in magic-card.css
        using the ::before and ::after pseudo-elements on .mouse-glow-card
        which consume the --mouse-x and --mouse-y variables.
        
        In reduced motion mode, the glow effect is disabled via CSS.
      */}
      {children}
    </div>
  );
};
