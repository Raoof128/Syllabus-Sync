'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * If true, applies the "liquid enhanced" glass effect classes
   */
  isLiquidEnhanced?: boolean;
}

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
 */
export const MagicCard = ({
  children,
  className,
  isLiquidEnhanced = true,
  ...props
}: MagicCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'mq-magic-card mouse-glow-card relative group',
        isLiquidEnhanced && 'mq-liquid-enhanced',
        className,
      )}
      style={
        {
          '--mouse-x': `${position.x}px`,
          '--mouse-y': `${position.y}px`,
          '--glow-opacity': opacity,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* 
        Note: The glow effect is handled via CSS in magic-card.css
        using the ::before and ::after pseudo-elements on .mouse-glow-card
        which consume the --mouse-x and --mouse-y variables.
      */}
      {children}
    </div>
  );
};
