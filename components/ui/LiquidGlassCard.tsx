// components/ui/LiquidGlassCard.tsx
// ============================================================================
// LIQUID GLASS CARD - Premium 3D Hover Effects with Mouse-Tracking Glow
// ============================================================================
// A polished card component with:
// - 3D perspective tilt on mouse move
// - Dynamic shadow elevation
// - Liquid glass backdrop blur
// - Mouse-tracking spotlight glow (Linear-style)
// - Smooth spring-based animations
// - Accessibility: respects prefers-reduced-motion
//
// USAGE:
// <LiquidGlassCard>
//   <h3>Card Title</h3>
//   <p>Card content...</p>
// </LiquidGlassCard>
//
// For mouse-tracking glow across multiple cards, wrap in a container:
// <MouseGlowContainer>
//   <LiquidGlassCard mouseGlow>...</LiquidGlassCard>
//   <LiquidGlassCard mouseGlow>...</LiquidGlassCard>
// </MouseGlowContainer>
//
// VARIANTS:
// - hero: Larger tilt angle, more dramatic shadows
// - gridItem: Optimized for grid layouts
// - subtle: Minimal effects for nested cards
// ============================================================================
'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
  useEffect,
} from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hero variant with more dramatic effects */
  hero?: boolean;
  /** Optimized for grid layouts */
  gridItem?: boolean;
  /** Subtle variant for nested cards */
  subtle?: boolean;
  /** Disable 3D tilt effect */
  disableTilt?: boolean;
  /** Disable glow effect */
  disableGlow?: boolean;
  /** Custom max tilt angle in degrees (default: 8) */
  maxTilt?: number;
  /** Custom perspective distance (default: 1000) */
  perspective?: number;
  /** Scale factor on hover (default: 1.02) */
  hoverScale?: number;
  /** Enable liquid glass filter */
  liquidGlass?: boolean;
  /** Enable mouse-tracking glow effect (Linear-style) */
  mouseGlow?: boolean;
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
// COMPONENT
// ============================================================================

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  className,
  children,
  hero = false,
  gridItem = false,
  subtle = false,
  disableTilt = false,
  disableGlow = false,
  maxTilt: customMaxTilt,
  perspective: customPerspective,
  hoverScale: customHoverScale,
  liquidGlass = false,
  mouseGlow = false,
  style,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  // Check for reduced motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Calculate effect parameters based on variant
  const effectParams = useMemo(() => {
    if (hero) {
      return {
        maxTilt: customMaxTilt ?? 12,
        perspective: customPerspective ?? 800,
        hoverScale: customHoverScale ?? 1.03,
        shadowIntensity: 1.5,
        glowIntensity: 0.25,
      };
    }
    if (subtle) {
      return {
        maxTilt: customMaxTilt ?? 4,
        perspective: customPerspective ?? 1200,
        hoverScale: customHoverScale ?? 1.01,
        shadowIntensity: 0.6,
        glowIntensity: 0.1,
      };
    }
    // Default / gridItem
    return {
      maxTilt: customMaxTilt ?? 8,
      perspective: customPerspective ?? 1000,
      hoverScale: customHoverScale ?? 1.02,
      shadowIntensity: 1,
      glowIntensity: 0.15,
    };
  }, [hero, subtle, customMaxTilt, customPerspective, customHoverScale]);

  // Handle mouse move for 3D tilt effect and mouse glow
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);

      if (prefersReducedMotion || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Update mouse position CSS variables for mouse glow effect
      if (mouseGlow) {
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
      }

      if (disableTilt) return;

      // Calculate tilt angles (inverted for natural feel)
      const tiltX = ((y - centerY) / centerY) * -effectParams.maxTilt;
      const tiltY = ((x - centerX) / centerX) * effectParams.maxTilt;

      setTilt({ x: tiltX, y: tiltY });

      // Calculate glow position as percentage
      if (!disableGlow) {
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        setGlowPosition({ x: glowX, y: glowY });
      }
    },
    [onMouseMove, prefersReducedMotion, disableTilt, disableGlow, effectParams.maxTilt, mouseGlow],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseEnter?.(e);
      setIsHovered(true);
    },
    [onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      setIsHovered(false);
      setTilt({ x: 0, y: 0 });
      setGlowPosition({ x: 50, y: 50 });
    },
    [onMouseLeave],
  );

  // Generate dynamic styles
  const dynamicStyles = useMemo((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      ...style,
      perspective: `${effectParams.perspective}px`,
    };

    if (prefersReducedMotion) {
      return baseStyles;
    }

    const transform = isHovered
      ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${effectParams.hoverScale}, ${effectParams.hoverScale}, 1)`
      : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

    // Dynamic shadow based on tilt
    const shadowOffsetX = tilt.y * 2 * effectParams.shadowIntensity;
    const shadowOffsetY = -tilt.x * 2 * effectParams.shadowIntensity;
    const shadowBlur = isHovered ? 40 : 20;
    const shadowSpread = isHovered ? 0 : -5;
    const shadowOpacity = isHovered ? 0.25 : 0.1;

    return {
      ...baseStyles,
      transform,
      transformStyle: 'preserve-3d' as const,
      boxShadow: isHovered
        ? `
          ${shadowOffsetX}px ${shadowOffsetY + 20}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity}),
          ${shadowOffsetX * 0.5}px ${shadowOffsetY * 0.5 + 10}px 20px -5px rgba(0, 0, 0, ${shadowOpacity * 0.7}),
          0 0 0 1px rgba(255, 255, 255, 0.1)
        `
        : `
          0 4px 20px -5px rgba(0, 0, 0, 0.1),
          0 0 0 1px var(--c-border)
        `,
      transition: isHovered
        ? 'transform 0.1s ease-out, box-shadow 0.3s ease-out'
        : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease-out',
    };
  }, [style, effectParams, prefersReducedMotion, isHovered, tilt]);

  // Generate glow overlay styles (radial gradient following mouse)
  const glowStyles = useMemo((): React.CSSProperties | null => {
    if (prefersReducedMotion || disableGlow || !isHovered) return null;

    return {
      position: 'absolute' as const,
      inset: 0,
      pointerEvents: 'none' as const,
      borderRadius: 'inherit',
      opacity: effectParams.glowIntensity,
      background: `radial-gradient(
        circle at ${glowPosition.x}% ${glowPosition.y}%,
        rgba(166, 25, 46, 0.4) 0%,
        rgba(166, 25, 46, 0.1) 40%,
        transparent 70%
      )`,
      transition: 'opacity 0.3s ease-out',
      zIndex: 1,
    };
  }, [prefersReducedMotion, disableGlow, isHovered, glowPosition, effectParams.glowIntensity]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Mouse handlers for 3D tilt visual effect only
    <div
      ref={cardRef}
      className={cn(
        // Base styles
        'relative overflow-hidden rounded-mq-lg',
        // Background and border
        'bg-mq-card-background border border-mq-border',
        // Transitions (CSS backup for non-JS)
        'transition-all duration-300',
        // Cursor
        'cursor-pointer',
        // Liquid glass enhancement
        liquidGlass && 'mq-liquid-enhanced',
        // Mouse glow effect
        mouseGlow && !prefersReducedMotion && 'mouse-glow-card',
        // Variant-specific classes
        hero && 'lg:min-h-[200px]',
        gridItem && 'h-full',
        subtle && 'border-transparent',
        // User className
        className,
      )}
      style={dynamicStyles}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Glow overlay (original radial glow) */}
      {glowStyles && <div style={glowStyles} aria-hidden="true" />}

      {/* Content wrapper with 3D depth */}
      <div
        className={cn('relative z-10 h-full', mouseGlow && 'mouse-glow-content')}
        style={{
          transform: isHovered && !prefersReducedMotion ? 'translateZ(20px)' : 'translateZ(0)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>

      {/* Red accent border on hover - replaces white shine */}
      {isHovered && !prefersReducedMotion && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'inherit',
            zIndex: 2,
            boxShadow: `
              inset 0 0 0 2px rgba(166, 25, 46, 0.3),
              0 0 20px rgba(166, 25, 46, 0.15)
            `,
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// MOUSE GLOW CONTAINER
// ============================================================================
// Wrapper component that enables the Linear-style mouse tracking effect
// across all child cards. When hovering over the container, all cards
// show their border glow effect.

interface MouseGlowContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MouseGlowContainer: React.FC<MouseGlowContainerProps> = ({
  className,
  children,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Update CSS custom properties on all child cards
  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cards = container.querySelectorAll<HTMLElement>('.mouse-glow-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  return (
    <div ref={containerRef} className={cn('mouse-glow-container', className)} {...props}>
      {children}
    </div>
  );
};

// ============================================================================
// SUB-CARD COMPONENT
// ============================================================================
// For nested interactive elements within cards that need subtle hover states
// with MQ red accent on hover and optional mouse tracking glow

interface SubCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active/selected state */
  active?: boolean;
  /** Disable red hover effect */
  disableRedHover?: boolean;
  /** Enable mouse-tracking glow effect */
  mouseGlow?: boolean;
}

export const SubCard: React.FC<SubCardProps> = ({
  className,
  children,
  active = false,
  disableRedHover = false,
  mouseGlow = false,
  onMouseMove,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Handle mouse move for mouse glow effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e as React.MouseEvent<HTMLDivElement>);

      if (mouseGlow && cardRef.current && !prefersReducedMotion) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    },
    [onMouseMove, mouseGlow, prefersReducedMotion],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Mouse handlers for visual glow effect only
    <div
      ref={cardRef}
      className={cn(
        // Base styles
        'relative rounded-mq-lg p-3 transition-all duration-300',
        // Background states
        'hover:bg-mq-subcard-hover active:bg-mq-subcard-active',
        active && 'bg-mq-subcard-active',
        // Red hover effect (unless disabled)
        !disableRedHover && [
          'hover:shadow-[inset_0_0_0_1px_rgba(166,25,46,0.2)]',
          'hover:shadow-[0_0_12px_rgba(166,25,46,0.08)]',
        ],
        // Mouse glow effect
        mouseGlow && !prefersReducedMotion && 'mouse-glow-subcard',
        className,
      )}
      style={{
        // Red glow on hover via box-shadow
        ...(!disableRedHover && {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }),
      }}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </div>
  );
};

export default LiquidGlassCard;
