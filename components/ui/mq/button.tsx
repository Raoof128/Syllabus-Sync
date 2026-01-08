import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-mq font-medium transition-all duration-mq-mid ease-mq-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-mq-primary text-white shadow-mq-sm hover:bg-mq-red-bright hover:shadow-mq hover:-translate-y-0.5 active:scale-[0.98]',
        secondary:
          'bg-mq-button-secondary text-mq-content border border-mq-border hover:bg-mq-red hover:border-mq-red hover:text-white hover:shadow-mq-sm hover:-translate-y-0.5 active:scale-[0.98]',
        destructive:
          'bg-mq-error text-white shadow-mq-sm hover:bg-mq-error/90 hover:shadow-mq hover:-translate-y-0.5 active:scale-[0.98]',
        outline:
          'border border-mq-border bg-transparent text-mq-content hover:bg-mq-red hover:border-mq-red hover:text-white hover:shadow-mq-sm hover:-translate-y-0.5 active:scale-[0.98]',
        ghost:
          'text-mq-content-secondary hover:bg-mq-red hover:text-white hover:shadow-mq-sm active:scale-[0.98]',
        // Liquid glass button variants
        glass: 'mq-liquid-btn',
        'glass-primary': 'mq-liquid-btn mq-liquid-btn-primary',
        'glass-navy': 'mq-liquid-btn mq-liquid-btn-navy',
      },
      size: {
        // Touch target sizes: 44px minimum on mobile for WCAG compliance, smaller on desktop
        sm: 'h-10 sm:h-8 px-3 text-[length:var(--fs-small)] min-h-[44px] sm:min-h-0',
        default: 'h-11 sm:h-10 px-4 py-2 text-[length:var(--fs-regular)] min-h-[44px] sm:min-h-0',
        lg: 'h-12 px-6 text-[length:var(--fs-large)]',
        icon: 'h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Apply premium glow effect on hover (default: false) */
  premium?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, premium = false, type = 'button', ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }), premium && 'btn-premium')}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
