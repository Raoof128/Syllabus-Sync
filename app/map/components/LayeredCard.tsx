import { cn } from '@/lib/utils';
import { ComponentProps, forwardRef } from 'react';

export interface LayeredCardProps extends ComponentProps<'div'> {
  interactive?: boolean;
}

// Soft spatial UI with layered depth
// Implements Tier 1: Visual Hierarchy & Depth
export const LayeredCard = forwardRef<HTMLDivElement, LayeredCardProps>(
  ({ className, interactive = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - Glassmorphism with depth
          'bg-mq-card-background/85 backdrop-blur-xl',
          'border border-white/20 dark:border-white/10',

          // Soft elevation - Multi-layered shadows for 3D feel
          'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.12)]',

          // Inner lighting for "thick glass" effect
          'ring-1 ring-inset ring-white/10 dark:ring-white/5',

          // Hover depth lift
          interactive &&
            'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12),0_20px_48px_rgba(0,0,0,0.16)] hover:bg-mq-card-background/95',

          className,
        )}
        {...props}
      />
    );
  },
);

LayeredCard.displayName = 'LayeredCard';
