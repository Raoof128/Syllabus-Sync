import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-mq px-2 py-1 text-mq-xs font-medium cursor-default',
  {
    variants: {
      variant: {
        neutral: 'bg-mq-background-secondary text-mq-content-secondary border border-mq-border',
        brand: 'bg-mq-primary text-white',
        secondary: 'bg-mq-secondary text-mq-content border border-mq-sand-400',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  },
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
