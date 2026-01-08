import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva('rounded-mq-lg transition-all duration-mq-mid ease-mq-ease', {
  variants: {
    variant: {
      default: 'border border-mq-border bg-mq-card-background shadow-mq-sm',
      elevated: 'border border-mq-border bg-mq-card-background shadow-mq hover:shadow-mq-lg',
      glass: 'mq-liquid-glass',
      'glass-elevated': 'mq-liquid-glass-elevated',
      'glass-subtle': 'mq-liquid-glass-subtle',
      'glass-security': 'mq-liquid-glass-security',
    },
    interactive: {
      true: 'cursor-pointer hover:-translate-y-0.5 hover:shadow-mq-lg active:scale-[0.99]',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    interactive: false,
  },
});

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  /** @deprecated Use variant="glass" or variant="glass-elevated" instead */
  glass?: boolean;
  /** @deprecated Use variant prop instead */
  glassVariant?: 'default' | 'elevated' | 'subtle' | 'security';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, glass, glassVariant, ...props }, ref) => {
    // Handle deprecated glass props for backward compatibility
    let resolvedVariant = variant;
    if (glass && !variant) {
      const glassVariantMap: Record<
        string,
        'glass' | 'glass-elevated' | 'glass-subtle' | 'glass-security'
      > = {
        default: 'glass',
        elevated: 'glass-elevated',
        subtle: 'glass-subtle',
        security: 'glass-security',
      };
      resolvedVariant = glassVariantMap[glassVariant || 'default'];
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant: resolvedVariant, interactive }), className)}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-mq-2xl font-semibold leading-none tracking-tight text-mq-content',
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-mq-sm text-mq-content-secondary', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
