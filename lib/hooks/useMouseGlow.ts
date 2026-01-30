// lib/hooks/useMouseGlow.ts
// ============================================================================
// MOUSE GLOW HOOK - Linear-style mouse tracking glow effect
// ============================================================================
// Creates a spotlight effect that follows the mouse cursor across card groups.
// Based on the Linear.app card hover effect pattern.
//
// USAGE:
// const { containerRef, getCardProps } = useMouseGlow();
// <div ref={containerRef}>
//   <div {...getCardProps()}>Card 1</div>
//   <div {...getCardProps()}>Card 2</div>
// </div>
// ============================================================================

'use client';

import { useRef, useCallback, useEffect, useSyncExternalStore } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface MouseGlowOptions {
  /** Glow color in rgba format (default: rgba(166, 25, 46, x) - MQ Red) */
  glowColor?: string;
  /** Radius of the glow spotlight in pixels (default: 600) */
  glowRadius?: number;
  /** Opacity of the border glow (default: 0.4) */
  borderGlowOpacity?: number;
  /** Opacity of the surface glow (default: 0.06) */
  surfaceGlowOpacity?: number;
  /** Enable/disable the effect (default: true) */
  enabled?: boolean;
}

export interface CardGlowProps {
  onMouseMove?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
  'data-mouse-glow'?: string;
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

// ============================================================================
// HOOK
// ============================================================================

export function useMouseGlow(options: MouseGlowOptions = {}) {
  const {
    glowColor = '166, 25, 46', // MQ Red RGB values
    glowRadius = 600,
    borderGlowOpacity = 0.4,
    surfaceGlowOpacity = 0.06,
    enabled = true,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Set<HTMLElement>>(new Set());

  // Check for reduced motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Update CSS custom properties on all registered cards
  const updateCards = useCallback(
    (e: MouseEvent) => {
      if (!enabled || prefersReducedMotion) return;

      cardsRef.current.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    },
    [enabled, prefersReducedMotion],
  );

  // Set up container mouse move listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => updateCards(e);

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, prefersReducedMotion, updateCards]);

  // Register a card element
  const registerCard = useCallback((element: HTMLElement | null) => {
    if (element) {
      cardsRef.current.add(element);
    }
  }, []);

  // Unregister a card element
  const unregisterCard = useCallback((element: HTMLElement | null) => {
    if (element) {
      cardsRef.current.delete(element);
    }
  }, []);

  // Get props to spread on card elements
  const getCardProps = useCallback(
    (_cardRef?: React.RefObject<HTMLElement | null>): CardGlowProps => {
      if (!enabled || prefersReducedMotion) {
        return {};
      }

      return {
        'data-mouse-glow': 'card',
        style: {
          // CSS custom properties for the glow effect
          '--glow-color': glowColor,
          '--glow-radius': `${glowRadius}px`,
          '--border-glow-opacity': borderGlowOpacity,
          '--surface-glow-opacity': surfaceGlowOpacity,
        } as React.CSSProperties,
        className: 'mouse-glow-card',
      };
    },
    [enabled, prefersReducedMotion, glowColor, glowRadius, borderGlowOpacity, surfaceGlowOpacity],
  );

  // Get CSS styles for including in stylesheets
  const getStyles = useCallback(() => {
    if (!enabled || prefersReducedMotion) return '';

    return `
      .mouse-glow-container:hover > .mouse-glow-card::after {
        opacity: 1;
      }

      .mouse-glow-card {
        position: relative;
      }

      .mouse-glow-card::before,
      .mouse-glow-card::after {
        border-radius: inherit;
        content: "";
        height: 100%;
        left: 0;
        opacity: 0;
        position: absolute;
        top: 0;
        transition: opacity 500ms;
        width: 100%;
        pointer-events: none;
      }

      /* Surface glow - subtle fill effect */
      .mouse-glow-card::before {
        background: radial-gradient(
          var(--glow-radius, 600px) circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(var(--glow-color, 166, 25, 46), var(--surface-glow-opacity, 0.06)),
          transparent 40%
        );
        z-index: 3;
      }

      .mouse-glow-card:hover::before {
        opacity: 1;
      }

      /* Border glow - stronger edge highlight */
      .mouse-glow-card::after {
        background: radial-gradient(
          calc(var(--glow-radius, 600px) * 0.8) circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(var(--glow-color, 166, 25, 46), var(--border-glow-opacity, 0.4)),
          transparent 40%
        );
        z-index: 1;
      }
    `;
  }, [enabled, prefersReducedMotion]);

  return {
    containerRef,
    registerCard,
    unregisterCard,
    getCardProps,
    getStyles,
    enabled: enabled && !prefersReducedMotion,
  };
}

// ============================================================================
// CARD WRAPPER COMPONENT (Optional helper)
// ============================================================================
// Use this if you want a simple wrapper component instead of the hook

export default useMouseGlow;
