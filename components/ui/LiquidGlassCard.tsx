'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  hero?: boolean;
  gridItem?: boolean;
}

// Minimal passthrough component to keep imports safe while removing Liquid Glass implementation
export const LiquidGlassCard: React.FC<Props> = ({ className, children, ...props }) => {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
};

export default LiquidGlassCard;
